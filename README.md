# Complaints and Document Management System

A full-stack application for managing complaints and documents with React frontend and Flask backend.

## Features

- **Complaint Management**: Create, read, update, and delete complaints
- **Status Tracking**: Three statuses (Pending, En cours, Validée) with change tracking
- **Document Upload**: Upload multiple documents per complaint
- **Validation**: Validate complaints with required document upload
- **Reference Numbers**: Format: `num/division/année` (e.g., `1/Division A/2025`)
- **Dashboard**: Charts and statistics for complaints
- **Print Template**: Print-friendly JSX component for complaints
- **Search & Filtering**: Filter by division, service, authority, type, and status

## Tech Stack

- **Backend**: Flask (Python), SQLite
- **Frontend**: React 18, Vite, React Router, Chart.js, Tailwind CSS
- **API**: RESTful JSON API

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 18+ and npm

### Backend Setup

1. Create a virtual environment (recommended):
   ```bash
   python -m venv env
   ```

2. Activate the virtual environment:
   - Windows: `env\Scripts\activate`
   - Linux/Mac: `source env/bin/activate`

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the Flask backend:
   ```bash
   python app.py
   ```
   The backend will run on `http://127.0.0.1:5000`

### Frontend Setup

1. Install Node.js dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173` (Vite default)

3. For production build:
   ```bash
   npm run build
   ```
   This creates the build in `frontend/dist` which Flask will serve.

## Project Structure

```
App49/
├── app.py                 # Flask backend API
├── requirements.txt       # Python dependencies
├── package.json           # Node.js dependencies
├── vite.config.js         # Vite configuration
├── index.html             # HTML entry point
├── src/
│   ├── main.jsx          # React entry point
│   ├── App.jsx           # Main app component with routing
│   ├── api.js            # API client functions
│   ├── index.css         # Global styles
│   └── components/
│       ├── Dashboard.jsx
│       ├── ComplaintList.jsx
│       ├── ComplaintForm.jsx
│       ├── ComplaintDetail.jsx
│       └── PrintTemplate.jsx
├── uploads/               # Uploaded documents (created automatically)
├── complaints.db         # SQLite database (created automatically)
└── frontend/
    └── dist/             # Production build output
```

## API Endpoints

- `GET /api/reference-data` - Get divisions, services, authorities
- `GET /api/dashboard` - Get dashboard statistics
- `GET /api/complaints` - List complaints (with filters)
- `POST /api/complaints` - Create new complaint
- `GET /api/complaints/:id` - Get complaint details
- `PUT /api/complaints/:id` - Update complaint
- `DELETE /api/complaints/:id` - Delete complaint
- `POST /api/complaints/:id/update-status` - Update complaint status
- `POST /api/complaints/:id/upload-document` - Upload document
- `GET /api/documents/:id` - Download document

## Complaint Status Flow

1. **Pending** - Initial status when complaint is created
2. **En cours** - Complaint is being processed
3. **Validée** - Complaint is validated (requires validation document upload)

## Reference Number Format

Complaints are assigned reference numbers in the format: `num/division/année`

Example: `1/Division A/2025`

- `num`: Sequential number per division
- `division`: Division name
- `année`: Year of creation

## Notes

- The database (`complaints.db`) is created automatically on first run
- Default reference data (divisions, services, authorities) is seeded automatically
- Uploaded files are stored in the `uploads/` directory
- For production, configure a proper WSGI server (e.g., Gunicorn) instead of Flask's development server
