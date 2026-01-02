import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getComplaints, getReferenceData, deleteComplaint, uploadDocument, updateComplaintStatus } from '../api'

function ComplaintList() {
  const [complaints, setComplaints] = useState([])
  const [referenceData, setReferenceData] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    division_id: '',
    security_service_id: '',
    local_authority_id: '',
    complaint_type: '',
    status: '',
  })
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 0,
    has_next: false,
    has_prev: false,
  })
  const [loading, setLoading] = useState(true)
  const [validationModal, setValidationModal] = useState({ open: false, complaintId: null, complaintNumber: '' })
  const [validationFile, setValidationFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const params = {
      ...filters,
      page: pagination.page,
      per_page: pagination.per_page,
    }
    Promise.all([getReferenceData(), getComplaints(params)])
      .then(([refRes, complaintsRes]) => {
        setReferenceData(refRes.data)
        setComplaints(complaintsRes.data.complaints)
        if (complaintsRes.data.pagination) {
          setPagination(prev => ({
            ...prev,
            ...complaintsRes.data.pagination,
          }))
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error loading data:', err)
        setLoading(false)
      })
  }, [
    filters.search,
    filters.division_id,
    filters.security_service_id,
    filters.local_authority_id,
    filters.complaint_type,
    filters.status,
    pagination.page,
    pagination.per_page,
  ])

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this complaint and all its documents?')) {
      try {
        await deleteComplaint(id)
        setComplaints(complaints.filter((c) => c.id !== id))
      } catch (err) {
        alert('Error deleting complaint')
      }
    }
  }

  const handleOpenValidationModal = (complaintId, complaintNumber) => {
    setValidationModal({ open: true, complaintId, complaintNumber })
    setValidationFile(null)
  }

  const handleCloseValidationModal = () => {
    setValidationModal({ open: false, complaintId: null, complaintNumber: '' })
    setValidationFile(null)
  }

  const handleValidateComplaint = async () => {
    if (!validationFile) {
      alert('Please select a validation document')
      return
    }

    setUploading(true)
    try {
      await uploadDocument(validationModal.complaintId, validationFile, true)
      await updateComplaintStatus(validationModal.complaintId, 'Terminer')
      
      const params = {
        ...filters,
        page: pagination.page,
        per_page: pagination.per_page,
      }
      const complaintsRes = await getComplaints(params)
      setComplaints(complaintsRes.data.complaints)
      if (complaintsRes.data.pagination) {
        setPagination(complaintsRes.data.pagination)
      }
      
      handleCloseValidationModal()
      alert('Complaint validated successfully!')
    } catch (err) {
      console.error('Error validating complaint:', err)
      alert('Error validating complaint. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value })
    setPagination({ ...pagination, page: 1 }) 
  }

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePerPageChange = (newPerPage) => {
    setPagination({ ...pagination, per_page: parseInt(newPerPage), page: 1 })
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    const tableElement = document.querySelector('table')
    if (!tableElement) return
    
    let tableHTML = '<table style="width: 100%; border-collapse: collapse; margin-top: 20px;">'
    const headerRow = tableElement.querySelector('thead tr')
    if (headerRow) {
      tableHTML += '<thead><tr>'
      headerRow.querySelectorAll('th').forEach(th => {
        tableHTML += `<th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2; font-weight: bold;">${th.textContent.trim()}</th>`
      })
      tableHTML += '</tr></thead>'
    }
    
    tableHTML += '<tbody>'
    complaints.forEach(complaint => {
      tableHTML += '<tr>'
      tableHTML += `<td style="border: 1px solid #ddd; padding: 8px;">${complaint.display_number}</td>`
      tableHTML += `<td style="border: 1px solid #ddd; padding: 8px;">${complaint.nom || '-'}</td>`
      tableHTML += `<td style="border: 1px solid #ddd; padding: 8px;">${complaint.division.name}</td>`
      tableHTML += `<td style="border: 1px solid #ddd; padding: 8px;">${complaint.security_service?.name || 'Not specified'}</td>`
      tableHTML += `<td style="border: 1px solid #ddd; padding: 8px;">${complaint.complaint_type}</td>`
      tableHTML += `<td style="border: 1px solid #ddd; padding: 8px;">${complaint.rappel || '-'}</td>`
      tableHTML += `<td style="border: 1px solid #ddd; padding: 8px;">${complaint.status}</td>`
      tableHTML += `<td style="border: 1px solid #ddd; padding: 8px;">${complaint.deadline}</td>`
      tableHTML += `<td style="border: 1px solid #ddd; padding: 8px;">-</td>`
      tableHTML += '</tr>'
    })
    tableHTML += '</tbody></table>'
    
    const style = `
      <style>
        @media print { @page { margin: 1cm; } body { margin: 0; } }
        body { font-family: sans-serif; margin: 20px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .print-header { margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
      </style>
    `
    printWindow.document.write(`<html><head><title>Print</title>${style}</head><body><div class="print-header"><h1>Complaints Report</h1></div>${tableHTML}</body></html>`)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print() }, 250)
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'En cours': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'Terminer': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'Retard': return 'bg-rose-100 text-rose-700 border-rose-200'
      default: return 'bg-slate-100 text-slate-600 border-slate-200'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Loading complaints...</p>
      </div>
    )
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Réclamations</h1>
          <p className="text-slate-500 mt-1">Gérer et suivre toutes les plaintes dans le système</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-semibold shadow-sm"
          >
            🖨️ Print
          </button>
          <Link
            to="/complaints/new"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-md shadow-blue-100"
          >
            ➕ New Complaint
          </Link>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          {/* <span>🔍</span> Filters & Search */}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <input
            type="text"
            placeholder="🔎 Search..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
          />
          {[
            { id: 'division_id', data: referenceData?.divisions, label: 'All Divisions' },
            { id: 'security_service_id', data: referenceData?.services, label: 'All Services' },
            { id: 'local_authority_id', data: referenceData?.authorities, label: 'All Authorities' },
          ].map((field) => (
            <select
              key={field.id}
              value={filters[field.id]}
              onChange={(e) => handleFilterChange(field.id, e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm outline-none cursor-pointer"
            >
              <option value="">{field.label}</option>
              {field.data?.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          ))}
          <select
            value={filters.complaint_type}
            onChange={(e) => handleFilterChange('complaint_type', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm outline-none cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="Urgent">Urgent</option>
            <option value="Normal">Normal</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="En cours">En cours</option>
            <option value="Terminer">Terminer</option>
            <option value="Retard">Retard</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Reference</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nom</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Division</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Service</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Rappel</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Deadline</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-slate-400 font-medium">
                    📭 No complaints found
                  </td>
                </tr>
              ) : (
                complaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/complaints/${complaint.id}`} className="text-blue-600 font-bold hover:underline">
                        {complaint.display_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">{complaint.nom}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {complaint.division.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 italic">
                      {complaint.security_service?.name || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded border ${complaint.complaint_type === 'Urgent' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {complaint.complaint_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {complaint.rappel ? (
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded bg-purple-50 text-purple-700 border border-purple-100 uppercase">
                          {complaint.rappel}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${getStatusBadgeClass(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                      {complaint.deadline}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/complaints/${complaint.id}`}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm"
                        >
                          👁️ View
                        </Link>
                        <Link
                          to={`/complaints/${complaint.id}/edit`}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 hover:text-amber-600 transition-all shadow-sm"
                        >
                          ✏️ Edit
                        </Link>
                        <Link
                          to={`/complaints/${complaint.id}/print`}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
                        >
                          🖨️ Print
                        </Link>
                        {complaint.status !== 'Terminer' && (
                          <button
                            onClick={() => handleOpenValidationModal(complaint.id, complaint.display_number)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-md"
                          >
                            ✅ Validate
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(complaint.id)}
                          className="px-3 py-1.5 bg-white border border-rose-100 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
              <span>Showing {complaints.length} entries</span>
              <select
                value={pagination.per_page}
                onChange={(e) => handlePerPageChange(e.target.value)}
                className="bg-transparent border-none text-slate-900 font-bold focus:ring-0 cursor-pointer"
              >
                <option value="10">10 / page</option>
                <option value="25">25 / page</option>
                <option value="50">50 / page</option>
              </select>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={!pagination.has_prev}
                className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all"
              >
                « First
              </button>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.has_prev}
                className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all"
              >
                Prev
              </button>
              <div className="px-4 text-xs font-bold text-slate-600">
                Page {pagination.page} / {pagination.pages}
              </div>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.has_next}
                className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all"
              >
                Next
              </button>
              <button
                onClick={() => handlePageChange(pagination.pages)}
                disabled={!pagination.has_next}
                className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all"
              >
                Last »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {validationModal.open && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span>✅</span> Validate Complaint
              </h2>
              <button onClick={handleCloseValidationModal} className="text-slate-400 hover:text-slate-600 text-xl font-light">✕</button>
            </div>

            <div className="p-8">
              <p className="text-sm text-slate-500 mb-6">
                Upload a validation document for complaint <span className="font-bold text-slate-900">#{validationModal.complaintNumber}</span>.
              </p>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Select File</label>
                <div className="relative border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 p-6 flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer">
                  <input
                    type="file"
                    onChange={(e) => setValidationFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  />
                  <div className="text-3xl mb-2">📤</div>
                  <p className="text-sm font-bold text-slate-700">
                    {validationFile ? validationFile.name : 'Click to browse files'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">PDF, Image, or Office documents</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={handleCloseValidationModal}
                disabled={uploading}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleValidateComplaint}
                disabled={uploading || !validationFile}
                className="flex-[2] px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all font-bold text-sm shadow-md"
              >
                {uploading ? 'Validating...' : '✅ Complete Validation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComplaintList