import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import ComplaintList from './components/ComplaintList'
import ComplaintForm from './components/ComplaintForm'
import ComplaintDetail from './components/ComplaintDetail'
import PrintTemplate from './components/PrintTemplate'

function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation()
  
  const menuItems = [
    {
      path: '/',
      label: 'Tableau de bord',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
      exact: true,
    },
    {
      path: '/complaints',
      label: 'Réclamations',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      exact: false,
    },
  ]
  
  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path
    }
    return location.pathname.startsWith(item.path) && location.pathname !== '/complaints/new'
  }
  
  return (
    <>
      {/* Overlay Mobile avec flou */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-slate-300 shadow-2xl transform transition-all duration-300 ease-in-out border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Marque */}
          <div className="px-6 py-8">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-white tracking-tight leading-none">
                  Gestion Des Plaints
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 font-semibold">
                  Portail D.A.I
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
            <p className="px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Menu Principal
            </p>
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive(item)
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className={`${isActive(item) ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'} transition-colors`}>
                  {item.icon}
                </span>
                <span className="font-medium text-sm">{item.label}</span>
                {isActive(item) && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-300" />
                )}
              </Link>
            ))}
            
            <div className="pt-4 mt-4 border-t border-slate-800">
              <Link
                to="/complaints/new"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-indigo-500 hover:bg-slate-700 text-white transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="font-semibold text-sm">Nouvelle plainte</span>
              </Link>
            </div>
          </nav>

          {/* Footer Sidebar */}
          <div className="p-6 border-t border-slate-800">
            <div className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                DAI
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-white truncate">DAI</p>
                <p className="text-[10px] text-slate-500"> 2025</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        
        {/* Contenu Principal */}
        <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
          {/* Header Mobile */}
          <header className="lg:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
            <div className="flex items-center justify-between px-4 h-16">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </button>
              <span className="font-bold text-slate-800">Gestion des Plaintes</span>
              <div className="w-10"></div>
            </div>
          </header>
          
          {/* Zone de contenu de la page */}
          <main className="p-4 md:p-6 lg:p-10 mx-auto mx-auto w-full">
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/complaints" element={<ComplaintList />} />
                <Route path="/complaints/new" element={<ComplaintForm />} />
                <Route path="/complaints/:id/edit" element={<ComplaintForm />} />
                <Route path="/complaints/:id" element={<ComplaintDetail />} />
                <Route path="/complaints/:id/print" element={<PrintTemplate />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App