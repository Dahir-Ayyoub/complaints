import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getComplaint } from '../api'

function PrintTemplate() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getComplaint(id)
      .then((res) => {
        setComplaint(res.data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error loading complaint:', err)
        setLoading(false)
      })
  }, [id])

  const formatAuthorityName = (name) => {
    if (!name) return 'XXX';
    if (name.includes('باشوية')) {
      return name.replace('باشوية', 'باشا');
    } else if (name.includes('دائرة')) {
      return `رئيس ${name}`;
    }
    return name;
  };

  const formatDisplayNumber = (displayNum) => {
    if (!displayNum) return '';
    const mapping = {
      'DAI': 'D1',
      'DCT': 'D2',
      'DAEC': 'D3',
      'DAR': 'D4',
      'DUEE': 'D5',
      'DRH': 'D6',
      'DBM': 'D7',
      'DGT': 'D8'
    };

    let formatted = displayNum;
    Object.keys(mapping).forEach(key => {
      if (formatted.includes(key)) {
        formatted = formatted.replace(key, mapping[key]);
      }
    });
    return formatted;
  };

  const getNotesText = () => {
    const baseText = "قصد البحث والإفادة مع إجابة المشتكي وموافاة مصالح العمالة بنسخة من الجواب";
    if (complaint?.complaint_type === 'Urgent') {
      return `'' ${baseText} داخل أجل لا يتعدى 48 ساعة ''`;
    }
    return `" ${baseText} "`;
  };

  if (loading) {
    return <div className="text-center py-8">جاري التحميل...</div>
  }

  if (!complaint) {
    return <div className="text-center py-8 text-red-600">الشكاية غير موجودة</div>
  }

  const regularDocuments = complaint.documents?.filter((d) => !d.is_validation) || []

  return (
    <div className="w-full flex justify-center printed" dir="rtl">
      <div className="no-print fixed bottom-4 left-4 z-50 flex gap-3">
        <button
          onClick={() => navigate(`/complaints/${id}`)}
          className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 shadow-lg border border-gray-200 font-semibold transition-all duration-200 hover:shadow-xl hover:scale-105"
        >
          العودة
        </button>
        <button
          onClick={() => window.print()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg font-semibold transition-all duration-200 hover:shadow-xl hover:scale-105 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          طباعة
        </button>
      </div>

      <div className="bg-white w-[210mm] min-h-[297mm] p-12 shadow-lg" style={{ fontFamily: "'Times New Roman', serif" }}>
        <div className="flex justify-between items-start mb-8">
          <div className="text-center text-sm font-bold leading-relaxed">
            <div>المملكة المغربية</div>
            <div>وزارة الداخلية</div>
            <div>عمالة إقليم الرحامنة</div>
            <div className="underline font-normal">قسم الشؤون الداخلية</div>
            <div>
              عدد: <span className="underline">{formatDisplayNumber(complaint.display_number)} </span>
            </div>
          </div>
          
          <div className="text-right text-sm font-bold">
            ابن جرير في: <span className="underline">{new Date(complaint.created_at).toLocaleDateString('ar-MA')}</span>
          </div>
        </div>

        <div className="text-center mt-5 mb-10">
          <h1 className="text-3xl font-bold my-1">عامل إقليم الرحامنة</h1>
          <div className="text-xl my-2">إلى</div>
          <h1 className="text-3xl font-bold my-1">السيد {formatAuthorityName(complaint.local_authority?.name)}</h1>
          <div className="text-3xl font-bold underline mt-4 inline-block">ورقة إرسال</div>
        </div>

        <table className="w-full border-2 border-black" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th className="border border-black p-4 text-xl font-bold text-center" style={{ width: '45%' }}>
                بيان الوثائق
              </th>
              <th className="border border-black p-4 text-xl font-bold text-center" style={{ width: '10%' }}>
                عددها
              </th>
              <th className="border border-black p-4 text-xl font-bold text-center" style={{ width: '45%' }}>
                ملاحظات
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-6 align-top" style={{ minHeight: '600px' }}>
                <div className="text-right text-lg leading-relaxed">
                  <p className="mb-6">
                    <strong><u>تجدون رفقته:</u></strong>
                  </p>
                  <p className="">
                    - نسخة من شكاية وردت على مصالح هذه العمالة في اسم : <strong>{complaint.nom}</strong>
                  </p>
                  <p className="mb-8">
                    بخصوص : <strong>{complaint.description}</strong>
                  </p>
                  
                  {/* Added Section Start */}
                  <p className="font-bold underline mt-24">
                    نسخة موجهة إلى :
                  </p>
                  <div className="h-32"></div> {/* This provides the empty space under it */}
                  {/* Added Section End */}

                </div>
              </td>
              <td className="border border-black p-4 align-top text-center text-lg">
                {/* {regularDocuments.length > 0 ? regularDocuments.length : '01'} */}
              </td>
              <td className="border border-black p-4 align-top text-center">
                <div className="text-lg font-bold leading-relaxed mt-12">
                  {getNotesText()}
                </div>
                <div className="text-2xl font-bold text-center mt-32 mb-64">
                  الإمضاء
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printed, .printed * {
            visibility: visible;
          }
          .printed {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  )
}

export default PrintTemplate