import os
from datetime import datetime, timedelta, date

from flask import (
    Flask,
    request,
    jsonify,
    send_file,
    send_from_directory,
)
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {
    "pdf",
    "png",
    "jpg",
    "jpeg",
    "gif",
    "doc",
    "docx",
    "xls",
    "xlsx",
}

DEADLINE_DAYS = {
    "Urgent": 2,
    "Normal": 7,
}

DEADLINE_APPROACHING_THRESHOLD_DAYS = 2


app = Flask(__name__, static_folder='frontend/dist', static_url_path='')
app.config["SECRET_KEY"] = "change-this-secret-key"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(
    BASE_DIR, "complaints.db"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
CORS(app)

db = SQLAlchemy(app)


class Division(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)

    complaints = db.relationship("Complaint", back_populates="division")

    def __repr__(self) -> str:
        return f"<Division {self.name}>"


class SecurityService(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)

    complaints = db.relationship("Complaint", back_populates="security_service")

    def __repr__(self) -> str:
        return f"<SecurityService {self.name}>"


class LocalAuthority(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), unique=True, nullable=False)

    complaints = db.relationship("Complaint", back_populates="local_authority")

    def __repr__(self) -> str:
        return f"<LocalAuthority {self.name}>"


class Complaint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    complaint_number = db.Column(db.Integer, nullable=False)
    #title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    complaint_type = db.Column(db.String(20), nullable=False)  # Urgent / Normal
    rappel = db.Column(db.String(20), nullable=True)  # rappel1, rappel2, rappel3
    nom = db.Column(db.String(255), nullable=True)  # Person name
    cnie = db.Column(db.String(50), nullable=True)  # CNIE number
    source = db.Column(db.String(100), nullable=True)  # Complaint source

    division_id = db.Column(db.Integer, db.ForeignKey("division.id"), nullable=False)
    security_service_id = db.Column(
        db.Integer, db.ForeignKey("security_service.id"), nullable=True
    )
    local_authority_id = db.Column(
        db.Integer, db.ForeignKey("local_authority.id"), nullable=False
    )

    deadline = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default="En cours", nullable=False)  # En cours, Terminer, Retard
    status_changed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    division = db.relationship("Division", back_populates="complaints")
    security_service = db.relationship(
        "SecurityService", back_populates="complaints"
    )
    local_authority = db.relationship(
        "LocalAuthority", back_populates="complaints"
    )
    documents = db.relationship(
        "Document", back_populates="complaint", cascade="all, delete-orphan"
    )

    __table_args__ = (
        db.UniqueConstraint(
            "division_id", "complaint_number", name="uq_division_complaint_number"
        ),
    )

    @property
    def display_number(self) -> str:
        year = self.created_at.year
        return f"{self.complaint_number}/{self.division.name}/{year}"

    @property
    def deadline_status(self) -> str:
        today = date.today()
        if self.deadline < today:
            return "Expired"
        delta_days = (self.deadline - today).days
        if 0 <= delta_days <= DEADLINE_APPROACHING_THRESHOLD_DAYS:
            return "Approaching"
        return "On Track"
    
    def check_and_update_status(self):
        """Check if deadline is exceeded and update status to Retard if needed"""
        if self.status == "Terminer":
            return  # Don't change status if already completed
        
        today = date.today()
        if self.deadline < today:
            if self.status != "Retard":
                self.status = "Retard"
                self.status_changed_at = datetime.utcnow()
                return True
        return False


class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey("complaint.id"), nullable=False)
    stored_filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    is_validation = db.Column(db.Boolean, default=False, nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    complaint = db.relationship("Complaint", back_populates="documents")


def allowed_file(filename: str) -> bool:
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


def calculate_deadline(complaint_type: str) -> date:
    days = DEADLINE_DAYS.get(complaint_type, DEADLINE_DAYS["Normal"])
    return (datetime.utcnow() + timedelta(days=days)).date()


def next_complaint_number_for_division(division_id: int) -> int:
    last = (
        db.session.query(db.func.max(Complaint.complaint_number))
        .filter_by(division_id=division_id)
        .scalar()
    )
    return (last or 0) + 1


def complaint_to_dict(complaint):
    """Convert Complaint model to dictionary"""
    return {
        "id": complaint.id,
        "complaint_number": complaint.complaint_number,
        "display_number": complaint.display_number,
        #"title": complaint.title,
        "description": complaint.description,
        "complaint_type": complaint.complaint_type,
        "rappel": complaint.rappel,
        "nom": complaint.nom,
        "cnie": complaint.cnie,
        "source": complaint.source,
        "status": complaint.status,
        "status_changed_at": complaint.status_changed_at.isoformat() if complaint.status_changed_at else None,
        "division_id": complaint.division_id,
        "division": {"id": complaint.division.id, "name": complaint.division.name},
        "security_service_id": complaint.security_service_id,
        "security_service": {"id": complaint.security_service.id, "name": complaint.security_service.name} if complaint.security_service else None,
        "local_authority_id": complaint.local_authority_id,
        "local_authority": {"id": complaint.local_authority.id, "name": complaint.local_authority.name},
        "deadline": complaint.deadline.isoformat(),
        "deadline_status": complaint.deadline_status,
        "created_at": complaint.created_at.isoformat(),
        "updated_at": complaint.updated_at.isoformat(),
        "documents": [
            {
                "id": doc.id,
                "original_filename": doc.original_filename,
                "is_validation": doc.is_validation,
                "uploaded_at": doc.uploaded_at.isoformat(),
            }
            for doc in complaint.documents
        ],
    }


def init_reference_data():
    # Divisions - example seed data
    default_divisions = ["DAI", "DCT","DAEC" ,"DAR","DUEE","DBM" ,"DRH","DGT"]
    for name in default_divisions:
        if not Division.query.filter_by(name=name).first():
            db.session.add(Division(name=name))

    # Security Services (fixed requirement)
    for name in ["Police", "Gendarmerie"]:
        if not SecurityService.query.filter_by(name=name).first():
            db.session.add(SecurityService(name=name))

    # Local Authorities - example seed data
    default_authorities = ["باشوية مدينة ابن جرير ", "باشوية مدينة سيدي بوعثمان", "دائرة سيدي بوعثمان","دائرة الرحامنة"]
    for name in default_authorities:
        if not LocalAuthority.query.filter_by(name=name).first():
            db.session.add(LocalAuthority(name=name))

    db.session.commit()


def setup_database():
    db.create_all()
    init_reference_data()


# API Routes

@app.route("/api/reference-data")
def get_reference_data():
    """Get divisions, security services, and local authorities"""
    divisions = [{"id": d.id, "name": d.name} for d in Division.query.order_by(Division.name).all()]
    services = [{"id": s.id, "name": s.name} for s in SecurityService.query.order_by(SecurityService.name).all()]
    authorities = [{"id": a.id, "name": a.name} for a in LocalAuthority.query.order_by(LocalAuthority.name).all()]
    return jsonify({"divisions": divisions, "services": services, "authorities": authorities})


@app.route("/api/dashboard")
def dashboard():
    total_complaints = Complaint.query.count()

    # Complaints by type
    type_rows = (
        db.session.query(Complaint.complaint_type, db.func.count(Complaint.id))
        .group_by(Complaint.complaint_type)
        .all()
    )
    type_counts = {t or "Unknown": c for t, c in type_rows}

    # Complaints by division (including divisions with zero complaints)
    division_rows = (
        db.session.query(Division.name, db.func.count(Complaint.id))
        .outerjoin(Complaint, Complaint.division_id == Division.id)
        .group_by(Division.id)
        .order_by(Division.name)
        .all()
    )
    division_labels = [name for name, _ in division_rows]
    division_values = [count for _, count in division_rows]
    
    # Get validated and retard counts per division
    division_validated = []
    division_retard = []
    for division_name in division_labels:
        division = Division.query.filter_by(name=division_name).first()
        if division:
            validated_count = Complaint.query.filter_by(
                division_id=division.id,
                status="Terminer"
            ).count()
            retard_count = Complaint.query.filter_by(
                division_id=division.id,
                status="Retard"
            ).count()
            division_validated.append(validated_count)
            division_retard.append(retard_count)
        else:
            division_validated.append(0)
            division_retard.append(0)

    # Complaints by deadline status
    status_counts = {"Expired": 0, "Approaching": 0, "On Track": 0}
    for c in Complaint.query.all():
        status_counts[c.deadline_status] = status_counts.get(c.deadline_status, 0) + 1

    # Complaints per day (last 30 days)
    days_back = 30
    start_date = (datetime.utcnow() - timedelta(days=days_back - 1)).date()
    daily_counts = {}
    rows = (
        db.session.query(
            db.func.date(Complaint.created_at), db.func.count(Complaint.id)
        )
        .filter(Complaint.created_at >= start_date)
        .group_by(db.func.date(Complaint.created_at))
        .order_by(db.func.date(Complaint.created_at))
        .all()
    )
    for day, count in rows:
        # day is a string or date depending on SQLite/SQLAlchemy; normalize to string
        key = str(day)
        daily_counts[key] = count

    daily_labels = []
    daily_values = []
    for i in range(days_back):
        d = start_date + timedelta(days=i)
        key = d.isoformat()
        daily_labels.append(key)
        daily_values.append(daily_counts.get(key, 0))

    # Check and update status for all complaints before counting
    for complaint in Complaint.query.all():
        complaint.check_and_update_status()
    db.session.commit()
    
    # Status counts (En cours, Terminer, Retard)
    status_rows = (
        db.session.query(Complaint.status, db.func.count(Complaint.id))
        .group_by(Complaint.status)
        .all()
    )
    complaint_status_counts = {s or "En cours": c for s, c in status_rows}
    
    # Calculate Retard percentage
    retard_count = complaint_status_counts.get("Retard", 0)
    retard_percentage = (retard_count / total_complaints * 100) if total_complaints > 0 else 0
    
    # Get monthly data for new and validated complaints (for history chart)
    months_back = 12
    monthly_labels = []
    monthly_new_values = []
    monthly_validated_values = []
    now = datetime.utcnow()
    
    for i in range(months_back):
        # Calculate month start and end
        month_offset = months_back - 1 - i
        # Get the first day of the month N months ago
        if month_offset == 0:
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            # Calculate the month N months ago
            target_month = now.month - month_offset
            target_year = now.year
            while target_month <= 0:
                target_month += 12
                target_year -= 1
            month_start = datetime(target_year, target_month, 1, 0, 0, 0)
        
        # Calculate month end (last day of the month)
        if month_start.month == 12:
            month_end = datetime(month_start.year + 1, 1, 1, 23, 59, 59) - timedelta(days=1)
        else:
            month_end = datetime(month_start.year, month_start.month + 1, 1, 23, 59, 59) - timedelta(days=1)
        
        # For the current month, use now as end
        if i == months_back - 1:
            month_end = now
        
        # Count new complaints in this month
        new_count = Complaint.query.filter(
            Complaint.created_at >= month_start,
            Complaint.created_at <= month_end
        ).count()
        
        # Count validated complaints in this month
        validated_count = Complaint.query.filter(
            Complaint.status == "Terminer",
            Complaint.status_changed_at.isnot(None),
            Complaint.status_changed_at >= month_start,
            Complaint.status_changed_at <= month_end
        ).count()
        
        monthly_labels.append(month_start.strftime('%b %Y'))
        monthly_new_values.append(new_count)
        monthly_validated_values.append(validated_count)

    return jsonify({
        "total_complaints": total_complaints,
        "type_counts": type_counts,
        "division_labels": division_labels,
        "division_values": division_values,
        "division_validated": division_validated,
        "division_retard": division_retard,
        "deadline_status_counts": status_counts,
        "complaint_status_counts": complaint_status_counts,
        "retard_percentage": round(retard_percentage, 2),
        "daily_labels": daily_labels,
        "daily_values": daily_values,
        "monthly_labels": monthly_labels,
        "monthly_new_values": monthly_new_values,
        "monthly_validated_values": monthly_validated_values,
    })


def apply_filters_and_search(query, filters=None):
    if filters is None:
        filters = request.args if request.is_json else request.args
    
    search = filters.get("search", "").strip() if isinstance(filters, dict) else (filters.get("search", "").strip() if hasattr(filters, 'get') else "")
    division_id = filters.get("division_id")
    security_service_id = filters.get("security_service_id")
    local_authority_id = filters.get("local_authority_id")
    complaint_type = filters.get("complaint_type")
    deadline_status = filters.get("deadline_status")
    status = filters.get("status")

    if search:
        like_pattern = f"%{search}%"
        query = query.join(Division)
        query = query.filter(
            db.or_(
                #Complaint.title.ilike(like_pattern),
                Complaint.description.ilike(like_pattern),
                db.cast(Complaint.complaint_number, db.String).ilike(like_pattern),
                (Division.name + "/" + db.cast(Complaint.complaint_number, db.String)).ilike(like_pattern),
            )
        )

    if division_id:
        query = query.filter(Complaint.division_id == int(division_id))
    if security_service_id:
        query = query.filter(Complaint.security_service_id == int(security_service_id))
    if local_authority_id:
        query = query.filter(Complaint.local_authority_id == int(local_authority_id))
    if complaint_type:
        query = query.filter(Complaint.complaint_type == complaint_type)
    if status:
        query = query.filter(Complaint.status == status)

    today = date.today()
    if deadline_status == "Expired":
        query = query.filter(Complaint.deadline < today)
    elif deadline_status == "Approaching":
        upcoming = today + timedelta(days=DEADLINE_APPROACHING_THRESHOLD_DAYS)
        query = query.filter(
            Complaint.deadline >= today, Complaint.deadline <= upcoming
        )

    return query


@app.route("/api/complaints")
def list_complaints():
    base_query = Complaint.query.options(
        db.joinedload(Complaint.division),
        db.joinedload(Complaint.security_service),
        db.joinedload(Complaint.local_authority),
        db.joinedload(Complaint.documents),
    ).order_by(Complaint.created_at.desc())
    
    # Get pagination parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    per_page = min(per_page, 100)  # Limit max per_page to 100
    
    # Apply filters
    filtered_query = apply_filters_and_search(base_query)
    
    # Get total count before pagination
    total = filtered_query.count()
    
    # Apply pagination
    paginated_complaints = filtered_query.paginate(
        page=page, 
        per_page=per_page, 
        error_out=False
    )
    
    # Check and update status for complaints on current page (set to Retard if deadline exceeded)
    updated = False
    for complaint in paginated_complaints.items:
        if complaint.check_and_update_status():
            updated = True
    if updated:
        db.session.commit()
        # Re-fetch current page after update
        paginated_complaints = filtered_query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )

    return jsonify({
        "complaints": [complaint_to_dict(c) for c in paginated_complaints.items],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": paginated_complaints.pages,
            "has_next": paginated_complaints.has_next,
            "has_prev": paginated_complaints.has_prev,
        },
        "deadline_approaching_threshold_days": DEADLINE_APPROACHING_THRESHOLD_DAYS,
    })


@app.route("/api/complaints", methods=["POST"])
def create_complaint():
    data = request.get_json()
    
    #title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    nom = data.get("nom", "").strip()
    cnie = data.get("cnie", "").strip()
    source = data.get("source", "").strip()
    division_id = data.get("division_id")
    security_service_id = data.get("security_service_id")
    local_authority_id = data.get("local_authority_id")
    complaint_type = data.get("complaint_type")
    rappel = data.get("rappel")  # Can be None, rappel1, rappel2, or rappel3

    #if not title or not description:
     #   return jsonify({"error": "Title and description are required."}), 400

    try:
        division_id = int(division_id)
        security_service_id = int(security_service_id) if security_service_id else None
        local_authority_id = int(local_authority_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid IDs provided."}), 400

    complaint_number = next_complaint_number_for_division(division_id)
    deadline = calculate_deadline(complaint_type)

    complaint = Complaint(
        complaint_number=complaint_number,
        #title=title,
        description=description,
        nom=nom or None,
        cnie=cnie or None,
        source=source or None,
        complaint_type=complaint_type,
        rappel=rappel,
        division_id=division_id,
        security_service_id=security_service_id,
        local_authority_id=local_authority_id,
        deadline=deadline,
        status="En cours",
    )
    db.session.add(complaint)
    db.session.commit()

    return jsonify(complaint_to_dict(complaint)), 201


@app.route("/api/complaints/<int:complaint_id>", methods=["GET"])
def get_complaint(complaint_id):
    complaint = Complaint.query.options(
        db.joinedload(Complaint.documents),
        db.joinedload(Complaint.division),
        db.joinedload(Complaint.security_service),
        db.joinedload(Complaint.local_authority),
    ).get_or_404(complaint_id)
    
    # Check and update status if deadline exceeded
    if complaint.check_and_update_status():
        db.session.commit()
    
    return jsonify(complaint_to_dict(complaint))


@app.route("/api/complaints/<int:complaint_id>", methods=["PUT"])
def update_complaint(complaint_id):
    complaint = Complaint.query.get_or_404(complaint_id)
    data = request.get_json()

    #title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    nom = data.get("nom", "").strip()
    cnie = data.get("cnie", "").strip()
    source = data.get("source", "").strip()
    division_id = data.get("division_id")
    security_service_id = data.get("security_service_id")
    local_authority_id = data.get("local_authority_id")
    complaint_type = data.get("complaint_type")
    rappel = data.get("rappel")  # Can be None, rappel1, rappel2, or rappel3
    status = data.get("status")

    #if not title or not description:
     #   return jsonify({"error": "Title and description are required."}), 400

    try:
        division_id = int(division_id)
        security_service_id = int(security_service_id) if security_service_id else None
        local_authority_id = int(local_authority_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid IDs provided."}), 400

    # if division changes, assign a new number for the new division
    if complaint.division_id != division_id:
        complaint.complaint_number = next_complaint_number_for_division(division_id)
        complaint.division_id = division_id

    # if complaint type changed, recalculate deadline
    if complaint.complaint_type != complaint_type:
        complaint.deadline = calculate_deadline(complaint_type)

    # if status changed, update status_changed_at
    if status and complaint.status != status:
        if status not in ["En cours", "Terminer", "Retard"]:
            return jsonify({"error": "Invalid status. Must be: En cours, Terminer, or Retard."}), 400
        complaint.status = status
        complaint.status_changed_at = datetime.utcnow()
    
    # Check deadline after update
    complaint.check_and_update_status()

    #complaint.title = title
    complaint.description = description
    complaint.nom = nom or None
    complaint.cnie = cnie or None
    complaint.source = source or None
    complaint.complaint_type = complaint_type
    complaint.rappel = rappel or None
    complaint.security_service_id = security_service_id
    complaint.local_authority_id = local_authority_id

    db.session.commit()
    return jsonify(complaint_to_dict(complaint))


@app.route("/api/complaints/<int:complaint_id>", methods=["DELETE"])
def delete_complaint(complaint_id):
    complaint = Complaint.query.get_or_404(complaint_id)

    # delete associated files from disk
    for doc in complaint.documents:
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], doc.stored_filename)
        if os.path.exists(filepath):
            os.remove(filepath)

    db.session.delete(complaint)
    db.session.commit()
    return jsonify({"message": "Complaint deleted successfully"}), 200


@app.route("/api/documents/<int:doc_id>")
def download_document(doc_id):
    doc = Document.query.get_or_404(doc_id)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], doc.stored_filename)
    if not os.path.exists(filepath):
        return jsonify({"error": "File not found on server."}), 404
    return send_file(
        filepath,
        as_attachment=True,
        download_name=doc.original_filename,
    )


@app.route("/api/complaints/<int:complaint_id>/upload-document", methods=["POST"])
def upload_document(complaint_id):
    complaint = Complaint.query.get_or_404(complaint_id)
    
    if "file" not in request.files:
        return jsonify({"error": "No file provided."}), 400
    
    file = request.files["file"]
    is_validation = request.form.get("is_validation", "false").lower() == "true"
    
    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "Unsupported file format."}), 400

    original_name = file.filename
    filename = secure_filename(original_name)
    unique_name = f"{complaint.id}_{'validation_' if is_validation else ''}{int(datetime.utcnow().timestamp())}_{filename}"
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], unique_name)
    file.save(filepath)

    doc = Document(
        complaint_id=complaint.id,
        stored_filename=unique_name,
        original_filename=original_name,
        is_validation=is_validation,
    )
    db.session.add(doc)
    db.session.commit()

    return jsonify({
        "id": doc.id,
        "original_filename": doc.original_filename,
        "is_validation": doc.is_validation,
        "uploaded_at": doc.uploaded_at.isoformat(),
    }), 201


@app.route("/api/complaints/<int:complaint_id>/update-status", methods=["POST"])
def update_complaint_status(complaint_id):
    complaint = Complaint.query.get_or_404(complaint_id)
    data = request.get_json()
    
    new_status = data.get("status")
    if new_status not in ["En cours", "Terminer", "Retard"]:
        return jsonify({"error": "Invalid status. Must be: En cours, Terminer, or Retard."}), 400
    
    complaint.status = new_status
    complaint.status_changed_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(complaint_to_dict(complaint))


@app.route("/api/complaints/<int:complaint_id>/pdf")
def complaint_pdf(complaint_id):
    complaint = Complaint.query.options(
        db.joinedload(Complaint.documents),
        db.joinedload(Complaint.division),
        db.joinedload(Complaint.security_service),
        db.joinedload(Complaint.local_authority),
    ).get_or_404(complaint_id)

    pdf_filename = f"complaint_{complaint.display_number}.pdf"
    pdf_path = os.path.join(UPLOAD_FOLDER, pdf_filename)

    c = canvas.Canvas(pdf_path, pagesize=A4)
    width, height = A4

    y = height - 50
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y, "Complaint Report")
    y -= 30

    c.setFont("Helvetica", 11)

    def draw_line(label, value):
        nonlocal y
        if y < 80:
            c.showPage()
            y = height - 50
            c.setFont("Helvetica", 11)
        c.drawString(50, y, f"{label}: {value}")
        y -= 18

    draw_line("Complaint Number", complaint.display_number)
    #draw_line("Title", complaint.title)
    draw_line("Type", complaint.complaint_type)
    draw_line("Status", complaint.status)
    draw_line("Division", complaint.division.name)
    draw_line("Security Service", complaint.security_service.name if complaint.security_service else "Not specified")
    draw_line("Local Authority", complaint.local_authority.name)
    draw_line("Created At", complaint.created_at.strftime("%Y-%m-%d %H:%M"))
    draw_line("Deadline", complaint.deadline.strftime("%Y-%m-%d"))
    draw_line("Deadline Status", complaint.deadline_status)

    # Description block
    y -= 10
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "Description:")
    y -= 20
    c.setFont("Helvetica", 11)

    # Simple text wrapping
    desc = complaint.description.replace("\r\n", "\n").replace("\r", "\n")
    for paragraph in desc.split("\n"):
        line = ""
        for word in paragraph.split(" "):
            if c.stringWidth(line + " " + word, "Helvetica", 11) > width - 100:
                draw_line("", line.strip())
                line = word
            else:
                if line:
                    line += " " + word
                else:
                    line = word
        if line:
            draw_line("", line)
        y -= 5

    # Documents
    y -= 10
    c.setFont("Helvetica-Bold", 12)
    if y < 80:
        c.showPage()
        y = height - 50
    c.drawString(50, y, "Attached Documents:")
    y -= 20
    c.setFont("Helvetica", 11)

    if complaint.documents:
        for doc in complaint.documents:
            draw_line("-", doc.original_filename)
    else:
        draw_line("-", "No documents attached.")

    c.showPage()
    c.save()

    return send_file(pdf_path, as_attachment=True, download_name=pdf_filename)


# Serve React app for all non-API routes
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react_app(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_file(os.path.join(app.static_folder, "index.html"))


if __name__ == "__main__":
    with app.app_context():
        setup_database()
    app.run(debug=True)
