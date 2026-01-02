import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  getComplaint,
  updateComplaintStatus,
  uploadDocument,
  downloadDocument,
  deleteComplaint,
} from '../api'

function ComplaintDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [validationFile, setValidationFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadComplaint()
  }, [id])

  const loadComplaint = () => {
    getComplaint(id)
      .then((res) => {
        setComplaint(res.data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error loading complaint:', err)
        setLoading(false)
      })
  }

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await updateComplaintStatus(id, newStatus)
      setComplaint(res.data)
    } catch (err) {
      alert('Error updating status')
    }
  }

  const handleValidationUpload = async () => {
    if (!validationFile) {
      alert('Please select a validation document')
      return
    }

    setUploading(true)
    try {
      await uploadDocument(id, validationFile, true)
      await handleStatusChange('Terminer')
      setValidationFile(null)
      loadComplaint()
      alert('Complaint validated successfully')
    } catch (err) {
      alert('Error uploading validation document')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this complaint and all its documents?')) {
      try {
        await deleteComplaint(id)
        navigate('/complaints')
      } catch (err) {
        alert('Error deleting complaint')
      }
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'En cours':
        return 'bg-amber-50 text-amber-700 ring-amber-600/20'
      case 'Terminer':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
      case 'Retard':
        return 'bg-rose-50 text-rose-700 ring-rose-600/20'
      default:
        return 'bg-slate-50 text-slate-700 ring-slate-600/20'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-100 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
        </div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse tracking-wide uppercase text-xs">Synchronizing Data...</p>
      </div>
    )
  }

  if (!complaint) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-50 text-rose-500 mb-6">
          <span className="text-3xl">!</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Record Missing</h2>
        <p className="text-slate-500 mb-8">The complaint record # {id} could not be retrieved from the server.</p>
        <Link to="/complaints" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  const regularDocuments = complaint.documents.filter((d) => !d.is_validation)
  const validationDocuments = complaint.documents.filter((d) => d.is_validation)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      {/* --- Global Action Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-3 text-slate-400 mb-3">
            <Link to="/complaints" className="hover:text-indigo-600 transition-colors">Case Management</Link>
            <span>/</span>
            <span className="text-slate-900 font-medium underline underline-offset-4 decoration-indigo-500/30">Details</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-4">
            #{complaint.display_number}
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full ring-1 ring-inset ${getStatusBadgeClass(complaint.status)}`}>
              {complaint.status}
            </span>
          </h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           <button
          onClick={() => navigate('/complaints')}
          className="inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm group"
        >
          <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to List
        </button>
          <Link to={`/complaints/${id}/print`} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
            <span>🖨️</span> Export PDF
          </Link>
          <Link to={`/complaints/${id}/edit`} className="px-5 py-2.5 bg-white border border-indigo-100 text-indigo-600 rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-50 transition-all flex items-center gap-2">
            <span>✏️</span> Edit Details
          </Link>
          <button onClick={handleDelete} className="px-5 py-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl font-bold text-sm shadow-sm hover:bg-rose-100 transition-all flex items-center gap-2">
            <span>🗑️</span> Remove
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* --- Primary Column: Narrative --- */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600 font-bold text-xs uppercase tracking-tighter">Narrative</span>
                <h2 className="text-xl font-bold text-slate-900">Objet de Réclamation</h2>
              </div>
              <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-wrap italic">
                  "{complaint.description || "No description provided for this case."}"
                </p>
              </div>
            </div>
          </div>

          {/* Workflow Section */}
          <div className="bg-indigo-900 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <span className="text-9xl font-black italic">STATUS</span>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-purple-300 animate-pulse"></span>
                Resolution Control
              </h3>

              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => handleStatusChange('En cours')}
                    disabled={complaint.status === 'En cours'}
                    className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-bold hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-md"
                  >
                    Mark "En cours"
                  </button>

                  {complaint.status !== 'Terminer' && (
                    <div className="flex flex-col sm:flex-row gap-3 flex-1 min-w-[280px]">
                      <div className="relative flex-1 group">
                        <input
                          type="file"
                          onChange={(e) => setValidationFile(e.target.files[0])}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="h-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium flex items-center justify-between group-hover:bg-white/20 transition-all">
                          <span className="truncate max-w-[180px] text-slate-300 italic">
                            {validationFile ? validationFile.name : "Select resolution file..."}
                          </span>
                          <span className="bg-indigo-500 text-[10px] px-2 py-1 rounded-md uppercase font-black">Browse</span>
                        </div>
                      </div>
                      <button
                        onClick={handleValidationUpload}
                        disabled={uploading || !validationFile}
                        className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-600 text-white rounded-xl font-black shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        {uploading ? "Processing..." : "Complete Case ✅"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-400/20">
                  <span className="text-indigo-300">💡</span>
                  <p className="text-xs text-indigo-100/70 leading-relaxed">
                    Once a case is moved to "Terminer", a validation document is required to verify the resolution steps taken by the department.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Supporting Evidence Grid */}
          <div className="space-y-4">
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">Supporting Evidence</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {regularDocuments.length > 0 ? (
                 regularDocuments.map((doc) => (
                    <div key={doc.id} className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between hover:shadow-md transition-shadow group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-xl shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-colors">📁</div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{doc.original_filename}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Attachment File</p>
                        </div>
                      </div>
                      <button onClick={() => downloadDocument(doc.id)} className="p-2 text-indigo-600 font-bold hover:bg-indigo-50 rounded-lg transition-colors">
                        ⬇️
                      </button>
                    </div>
                 ))
               ) : (
                 <div className="col-span-2 py-10 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                    <p className="text-slate-400 text-sm">No evidence documents found for this case.</p>
                 </div>
               )}
             </div>
          </div>
        </div>

        {/* --- Sidebar Column: Metadata --- */}
        <div className="lg:col-span-4 space-y-6">
          {/* Reporter Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Subject Information</h4>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-100">
                {complaint.nom?.charAt(0) || '?'}
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 leading-tight">{complaint.nom || 'Anonymous'}</p>
                <p className="text-sm font-medium text-slate-500">{complaint.cnie || 'No CNIE Registry'}</p>
              </div>
            </div>
            
            <div className="space-y-4 pt-6 border-t border-slate-50">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Address</span>
                <span className="text-slate-900 font-bold">{complaint.source || 'Standard'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Priority</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${complaint.complaint_type === 'Urgent' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                  {complaint.complaint_type}
                </span>
              </div>
            </div>
          </div>

          {/* Admin Metadata Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Departmental Routing</h4>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter block mb-1">Division responsable</label>
                <p className="text-sm font-bold text-slate-800">{complaint.division.name}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter block mb-1">Autorité locale </label>
                <p className="text-sm font-bold text-slate-800">{complaint.local_authority.name}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter block mb-1">Service de sécurité </label>
                <p className="text-sm font-bold text-slate-800">{complaint.security_service?.name || 'Unassigned'}</p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter block">Deadline</label>
                  <p className="text-sm font-black text-rose-600">{complaint.deadline}</p>
                </div>
                <div className="text-right text-[10px] text-slate-400 font-medium">
                  Logged: <br/> {new Date(complaint.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Validation Proof List */}
          {validationDocuments.length > 0 && (
            <div className="bg-emerald-50 rounded-3xl border border-emerald-100 p-6">
              <h4 className="text-[11px] font-black text-emerald-800 uppercase tracking-[0.2em] mb-4">Resolution Proof</h4>
              <div className="space-y-3">
                {validationDocuments.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => downloadDocument(doc.id)}
                    className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-200/50 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📜</span>
                      <span className="text-xs font-bold text-emerald-900 truncate max-w-[140px]">{doc.original_filename}</span>
                    </div>
                    <span className="text-emerald-500 text-[10px] font-black group-hover:mr-1 transition-all">VIEW</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ComplaintDetail