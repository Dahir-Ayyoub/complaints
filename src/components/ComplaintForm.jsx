import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getReferenceData, getComplaint, createComplaint, updateComplaint, uploadDocument } from '../api'

function ComplaintForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    nom: '',
    cnie: '',
    source: '',
    description: '',
    division_id: '',
    security_service_id: '',
    local_authority_id: '',
    complaint_type: 'Normal',
    rappel: '',
  })
  const [referenceData, setReferenceData] = useState(null)
  const [documents, setDocuments] = useState([])
  const [newFiles, setNewFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getReferenceData()
      .then((res) => {
        setReferenceData(res.data)
        if (isEdit) {
          return getComplaint(id).then((complaintRes) => {
            const complaint = complaintRes.data
            setFormData({
              nom: complaint.nom || '',
              cnie: complaint.cnie || '',
              source: complaint.source || '',
              description: complaint.description,
              division_id: complaint.division_id,
              security_service_id: complaint.security_service_id,
              local_authority_id: complaint.local_authority_id,
              complaint_type: complaint.complaint_type,
              rappel: complaint.rappel || '',
            })
            setDocuments(complaint.documents || [])
            setLoading(false)
          })
        } else {
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Error loading data:', err)
        setLoading(false)
      })
  }, [id, isEdit])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    setNewFiles(Array.from(e.target.files))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      let complaintId
      if (isEdit) {
        const res = await updateComplaint(id, formData)
        complaintId = res.data.id
      } else {
        const res = await createComplaint(formData)
        complaintId = res.data.id
      }

      for (const file of newFiles) {
        await uploadDocument(complaintId, file, false)
      }

      navigate(`/complaints/${complaintId}`)
    } catch (err) {
      console.error('Error saving complaint:', err)
      alert('Error saving complaint. Please try again.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading complaint data...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isEdit ? 'Edit Complaint' : 'New Complaint Registration'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isEdit ? 'Modify the details of the existing case' : 'Official registration of a new citizen grievance'}
          </p>
        </div>
        <button
          onClick={() => navigate('/complaints')}
          className="inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm group"
        >
          <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Document Upload Card */}
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 transition-all">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </div>
            <label className="text-sm font-bold text-slate-800 uppercase tracking-wider">Supporting Documents</label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative group">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="border-2 border-dashed border-indigo-200 bg-white rounded-xl p-8 text-center group-hover:border-indigo-400 transition-colors">
                <p className="text-indigo-600 font-semibold mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-400 uppercase">PDF, JPG, PNG, DOCX</p>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              {newFiles.length > 0 ? (
                <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Queue ({newFiles.length} files)</p>
                  <ul className="space-y-1">
                    {newFiles.map((file, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No new files selected for upload.</p>
              )}
            </div>
          </div>
        </div>

        {/* Main Form Fields */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 space-y-8">
            {/* Section: Détails personnels */}
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <span className="w-8 h-px bg-slate-200"></span> Détails personnels
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nom complet </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                    placeholder="Entrer le nom complet..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Numéro de la CNIE</label>
                  <input
                    type="text"
                    name="cnie"
                    value={formData.cnie}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                    placeholder="AA00000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                  <input
                    type="text"
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                    placeholder="Address ..."
                  />
                </div>
              </div>
            </div>

            {/* Section: Affectation */}
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <span className="w-8 h-px bg-slate-200"></span> Affectation
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Division</label>
                  <select
                    name="division_id"
                    value={formData.division_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Division</option>
                    {referenceData?.divisions.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Autorité locale</label>
                  <select
                    name="local_authority_id"
                    value={formData.local_authority_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Authority</option>
                    {referenceData?.authorities.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Service de sécurité</label>
                  <select
                    name="security_service_id"
                    value={formData.security_service_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Service</option>
                    {referenceData?.services.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Type de priorité</label>
                  <select
                    name="complaint_type"
                    value={formData.complaint_type}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 outline-none transition-all appearance-none cursor-pointer font-semibold ${
                      formData.complaint_type === 'Urgent' 
                        ? 'bg-red-50 border-red-200 text-red-700 focus:ring-red-500/20 focus:border-red-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                  >
                    <option value="Urgent">⚠️ Urgent (2 jours)</option>
                    <option value="Normal">📋 Normal (7 jours)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section: Subject Content */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-2">Objet </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="5"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none placeholder:text-slate-400"
                  placeholder="Fournir un objet détaillé de la plainte..."
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">Rappel</label>
                <select
                  name="rappel"
                  value={formData.rappel}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">No Rappel</option>
                  <option value="rappel1"> Rappel 1</option>
                  <option value="rappel2"> Rappel 2</option>
                  <option value="rappel3"> Rappel 3</option>
                </select>
                
              </div>
            </div>

            {/* Existing Documents section */}
            {isEdit && documents.length > 0 && (
              <div className="pt-6 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
                  Stored Archives
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 group hover:bg-white hover:shadow-sm transition-all">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-slate-600 truncate font-medium">{doc.original_filename}</span>
                      </div>
                      {doc.is_validation && (
                        <span className="shrink-0 flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                          Valid
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="bg-slate-50 px-8 py-6 flex flex-col sm:flex-row justify-end gap-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/complaints')}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  {isEdit ? 'Update Complaint' : 'Confirm Registration'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ComplaintForm