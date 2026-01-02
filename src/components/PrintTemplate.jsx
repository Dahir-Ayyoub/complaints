import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getComplaint } from '../api';

function PrintTemplate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  // الحالة العامة للنسخ الموجهة
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [copies, setCopies] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [newManualName, setNewManualName] = useState('');

  const DEFAULT_PURPOSE = "قصد الإخبار و التتبع";

  // خريطة تحويل أسماء الأقسام
  const divisionMapping = {
    'DAI': 'قسم الشؤون الداخلية',
    'DAEC': 'قسم الشؤون الإقتصادية',
    'DAR': 'قسم الشؤون القروية',
    'DCT': 'قسم الجماعات الترابية',
    'DGT': 'قسم الحكامة الترابية',
    'DRH': 'قسم الموارد البشرية و التكوين',
    'DUEE': ' قسم التعمير و البيئة و التجهيز ',
    'DBM': 'قسم الميزانية والصفقات'
  };

  // خريطة تحويل المصالح الأمنية
  const securityMapping = {
    'Police': 'الشرطة',
    'Gendarmerie': 'الدرك الملكي'
  };

  useEffect(() => {
    getComplaint(id)
      .then((res) => {
        const data = res.data;
        setComplaint(data);
        
        const initialVersions = [];
        
        // 1. معالجة القسم (Division)
        if (data.division?.name) {
          const mappedName = divisionMapping[data.division.name] || data.division.name;
          initialVersions.push({ id: 'div-' + Date.now(), name: mappedName, purpose: DEFAULT_PURPOSE });
        }

        // 2. معالجة السلطة المحلية (Local Authority)
        // if (data.local_authority?.name) {
        //   initialVersions.push({ id: 'auth-' + Date.now(), name: data.local_authority.name, purpose: DEFAULT_PURPOSE });
        // }

        // 3. معالجة المصالح الأمنية (Security Service)
        if (data.security_service?.name) {
          // إذا كان الاسم Police أو Gendarmerie يتم تحويله، وإلا يبقى كما هو
          const mappedSec = securityMapping[data.security_service.name] || data.security_service.name;
          initialVersions.push({ id: 'sec-' + Date.now(), name: mappedSec, purpose: DEFAULT_PURPOSE });
        }
        
        setSelectedRecipients(initialVersions);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading complaint:', err);
        setLoading(false);
      });
  }, [id]);

  // إدارة النسخ (إضافة، حذف، تعديل)
  const handleAddVersion = () => {
    const nameToAdd = newManualName.trim() || "نسخة جديدة";
    setSelectedRecipients([
      ...selectedRecipients,
      { id: Date.now(), name: nameToAdd, purpose: DEFAULT_PURPOSE }
    ]);
    setNewManualName('');
  };

  const removeVersion = (idToRemove) => {
    setSelectedRecipients(selectedRecipients.filter(v => v.id !== idToRemove));
  };

  const updateVersion = (idToUpdate, field, newValue) => {
    setSelectedRecipients(prev => 
      prev.map(v => v.id === idToUpdate ? { ...v, [field]: newValue } : v)
    );
  };

  const handlePrintAction = () => {
    setShowModal(false);
    setTimeout(() => { window.print(); }, 500);
  };

  // تنسيق المسميات الرسمية
  const formatAuthorityName = (name) => {
    if (!name) return 'XXX';
    if (name.includes('باشوية')) return name.replace('باشوية', 'باشا');
    if (name.includes('دائرة')) return `رئيس ${name}`;
    return name;
  };

  const formatDisplayNumber = (displayNum) => {
    if (!displayNum) return '';
    const mapping = { 'DAI': 'D1', 'DCT': 'D2', 'DAEC': 'D3', 'DAR': 'D4', 'DUEE': 'D5', 'DRH': 'D6', 'DBM': 'D7', 'DGT': 'D8' };
    let formatted = displayNum;
    Object.keys(mapping).forEach(key => {
      if (formatted.includes(key)) formatted = formatted.replace(key, mapping[key]);
    });
    return formatted;
  };

  const getNotesText = () => {
    const baseText = "قصد البحث والإفادة مع إجابة المشتكي وموافاة مصالح العمالة بنسخة من الجواب";
    return complaint?.complaint_type === 'Urgent' 
      ? `'' ${baseText} داخل أجل لا يتعدى 48 ساعة ''` 
      : `" ${baseText} "`;
  };

  if (loading) return <div className="text-center py-8">جاري التحميل...</div>;
  if (!complaint) return <div className="text-center py-8 text-red-600">الشكاية غير موجودة</div>;

  // تجهيز الصفحات للطباعة
  const pagesToPrint = [];
  for (let i = 0; i < copies; i++) {
    selectedRecipients.forEach(v => pagesToPrint.push(v));
  }

  return (
    <div className="print-main-wrapper w-full flex flex-col items-center bg-gray-100 min-h-screen pb-10" dir="rtl">
      
      {/* الأزرار العائمة (لا تظهر في الطباعة) */}
      <div className="no-print fixed bottom-4 left-4 z-50 flex gap-3">
        <button onClick={() => navigate(`/complaints/${id}`)} className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 shadow-lg border border-gray-200 font-semibold">
          العودة
        </button>
        <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg font-semibold flex items-center gap-2">
          إعدادات الطباعة
        </button>
      </div>

      {/* نافذة الإعدادات (Modal) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4 no-print">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold mb-6 border-b pb-2">تخصيص النسخ الموجهة</h2>
            
            <div className="mb-6">
              <label className="text-sm font-bold ml-4">عدد النسخ لكل ورقة:</label>
              <input type="number" min="1" value={copies} onChange={(e) => setCopies(parseInt(e.target.value) || 1)} className="w-20 border rounded p-2 text-center" />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold mb-3">قائمة النسخ (يمكنك تعديل المسمى أو الغرض):</label>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {selectedRecipients.map((v) => (
                  <div key={v.id} className="p-3 bg-gray-50 rounded border flex flex-col gap-2 relative group">
                    <button 
                      onClick={() => removeVersion(v.id)} 
                      className="absolute -left-2 -top-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >✕</button>
                    
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <span className="text-[10px] text-gray-500 block">الموجه إليه:</span>
                        <input 
                          type="text" 
                          value={v.name} 
                          onChange={(e) => updateVersion(v.id, 'name', e.target.value)}
                          className="w-full border rounded p-1 text-sm font-bold"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] text-gray-500 block">الغرض:</span>
                        <input 
                          type="text" 
                          value={v.purpose} 
                          onChange={(e) => updateVersion(v.id, 'purpose', e.target.value)}
                          className="w-full border rounded p-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6 border-t pt-4">
              <label className="block text-sm font-bold mb-2">إضافة جهة أخرى:</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newManualName}
                  onChange={(e) => setNewManualName(e.target.value)}
                  placeholder="مثال: السيد مندوب التعاون الوطني"
                  className="flex-1 border rounded-lg p-2 text-sm"
                />
                <button onClick={handleAddVersion} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-bold">+ إضافة</button>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={handlePrintAction} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold">طباعة ({pagesToPrint.length} صفحة)</button>
              <button onClick={() => setShowModal(false)} className="px-6 py-3 bg-gray-200 rounded-lg">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* تخطيط الطباعة (Print Layout) */}
      <div className="printed-container">
        {pagesToPrint.map((version, index) => (
          <div key={index} className="print-page bg-white w-[210mm] min-h-[297mm] p-12 mb-8 shadow-lg relative mx-auto" style={{ fontFamily: "'Times New Roman', serif" }}>
            
            {/* الترويسة */}
            <div className="flex justify-between items-start mb-8">
              <div className="text-center text-sm font-bold leading-relaxed">
                <div>المملكة المغربية</div>
                <div>وزارة الداخلية</div>
                <div>عمالة إقليم الرحامنة</div>
                <div className="underline font-normal">قسم الشؤون الداخلية</div>
                <div>عدد: <span className="underline">{formatDisplayNumber(complaint.display_number)} </span></div>
              </div>
              <div className="text-right text-sm font-bold">
                ابن جرير في: <span className="underline">{new Date(complaint.created_at).toLocaleDateString('ar-MA')}</span>
              </div>
            </div>

            {/* العنوان المرسل إليه */}
            <div className="text-center mt-5 mb-10">
              <h1 className="text-3xl font-bold my-1">عامل إقليم الرحامنة</h1>
              <div className="text-xl my-2">إلى</div>
              <h1 className="text-3xl font-bold my-1">السيد {formatAuthorityName(complaint.local_authority?.name)}</h1>
              <div className="text-3xl font-bold underline mt-4 inline-block">ورقة إرسال</div>
            </div>

            {/* الجدول الرئيسي */}
            <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th className="border border-black p-4 text-xl font-bold text-center" style={{ width: '45%' }}>بيان الوثائق</th>
                  <th className="border border-black p-4 text-xl font-bold text-center" style={{ width: '10%' }}>عددها</th>
                  <th className="border border-black p-4 text-xl font-bold text-center" style={{ width: '45%' }}>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-6 align-top" style={{ height: '600px' }}>
                    <div className="text-right text-lg leading-relaxed h-full flex flex-col justify-between">
                      <div>
                        <p className="mb-6"><strong><u>تجدون رفقته:</u></strong></p>
                        <p className="">- نسخة من شكاية وردت على مصالح هذه العمالة في اسم  <strong>{complaint.nom} ، </strong> بخصوص  <strong>{complaint.description}</strong></p>
                      </div>

                      {/* النسخة الموجهة */}
                      <div className="mt-auto pb-10">
                        <p className="font-bold underline mb-2">نسخة موجهة إلى :</p>
                        <div className="pr-4">
                          <p className="text-xl font-bold">{version.name}</p>
                          <p className="text-lg font-normal">"{version.purpose}"</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="border border-black p-4 align-top text-center text-lg">01</td>
                  <td className="border border-black p-4 align-top text-center">
                    <div className="text-lg font-bold leading-relaxed mt-12">{getNotesText()}</div>
                    <div className="text-2xl font-bold text-center mt-32">الإمضاء</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* أنماط الطباعة الثابتة */}
      <style>{`
        @media print {
          nav, header, .navbar, .sidebar, .hamburger, [class*="menu"], [class*="nav"] {
            display: none !important;
          }
          body, html {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print { display: none !important; }
          .print-page {
            margin: 0 !important;
            box-shadow: none !important;
            page-break-after: always !important;
            width: 210mm;
            height: 297mm;
          }
          .print-page:last-child { page-break-after: avoid !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </div>
  );
}

export default PrintTemplate;