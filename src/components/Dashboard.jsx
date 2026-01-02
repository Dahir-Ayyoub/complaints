import React, { useEffect, useState } from 'react'
import { getDashboardData } from '../api'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
)

function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardData()
      .then((res) => {
        setData(res.data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error loading dashboard:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
        <p className="text-slate-500 font-medium animate-pulse">Chargement du tableau de bord...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto mt-10 bg-red-50 border border-red-100 p-6 rounded-2xl flex items-center gap-4">
        <div className="bg-red-100 p-3 rounded-full text-2xl">⚠️</div>
        <div>
          <h3 className="text-red-800 font-bold text-lg">Erreur de chargement</h3>
          <p className="text-red-600">Impossible de récupérer les données. Veuillez actualiser la page.</p>
        </div>
      </div>
    )
  }

  const divisionChartData = {
    labels: data.division_labels,
    datasets: [
      {
        label: 'Total Réclamations',
        data: data.division_values,
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(79, 70, 229, 1)',
      },
      {
        label: 'Validées',
        data: data.division_validated || [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(16, 185, 129, 1)',
      },
      {
        label: 'Retard',
        data: data.division_retard || [],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(239, 68, 68, 1)',
      },
    ],
  }

  const typeChartData = {
    labels: Object.keys(data.type_counts),
    datasets: [
      {
        data: Object.values(data.type_counts),
        backgroundColor: ['#ef4444', '#3b82f6'], // Urgent = red, Normal = blue
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  }

  // Ensure status labels are in correct order: En cours, Terminer, Retard
  // Always show all 3 statuses in the legend, even if count is 0
  const statusOrder = ['En cours', 'Terminer', 'Retard']
  const statusLabels = statusOrder // Always include all 3 statuses
  const statusValues = statusLabels.map(status => data.complaint_status_counts[status] || 0)

  const statusChartData = {
    labels: statusLabels,
    datasets: [
      {
        data: statusValues,
        backgroundColor: [
          '#3b82f6', // Blue for En cours
          '#10b981', // Green for Terminer
          '#ef4444', // Red for Retard
        ],
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  }

  const dailyChartData = {
    labels: data.daily_labels.map((d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })),
    datasets: [
      {
        label: 'Nouvelles Réclamations',
        data: data.daily_values,
        borderColor: '#4f46e1',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#4f46e1',
      },
    ],
  }

  // Monthly history chart with new and validated complaints
  const monthlyChartData = {
    labels: data.monthly_labels || [],
    datasets: [
      {
        label: 'Nouvelles Réclamations',
        data: data.monthly_new_values || [],
        borderColor: '#4f46e1',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#4f46e1',
      },
      {
        label: 'Réclamations Validées',
        data: data.monthly_validated_values || [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#10b981',
      },
    ],
  }

  // Retard percentage chart data
  const retardChartData = {
    labels: ['Retard', 'Autres'],
    datasets: [
      {
        data: [
          data.retard_percentage || 0,
          100 - (data.retard_percentage || 0)
        ],
        backgroundColor: ['#ef4444', '#e2e8f0'],
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, family: 'Inter, sans-serif' }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: {
          stepSize: 1,
          precision: 0
        }
      },
      x: {
        grid: { display: false }
      }
    }
  }

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, family: 'Inter, sans-serif' }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
    },
  }
  
  // Plugin to display percentage in center of doughnut charts
  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: (chart) => {
      const ctx = chart.ctx;
      const centerX = chart.chartArea.left + (chart.chartArea.right - chart.chartArea.left) / 2;
      const centerY = chart.chartArea.top + (chart.chartArea.bottom - chart.chartArea.top) / 2;
      
      ctx.save();
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
      if (total > 0) {
        const percentages = chart.data.datasets[0].data.map(val => 
          ((val / total) * 100).toFixed(1) + '%'
        );
        const labels = chart.data.labels;
        let yOffset = -20;
        labels.forEach((label, index) => {
          ctx.fillText(`${percentages[index]}`, centerX, centerY + yOffset);
          ctx.font = '12px Inter, sans-serif';
          ctx.fillStyle = '#64748b';
          ctx.fillText(label, centerX, centerY + yOffset + 20);
          yOffset += 50;
        });
      }
      ctx.restore();
    }
  }

  return (
    <div className="p-4 sm:p-8 bg-slate-50 min-h-screen">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Tableau de Bord</h1>
        <p className="text-slate-500 mt-1 text-lg font-medium">Analyse en temps réel des réclamations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total Réclamations</p>
              <p className="text-4xl font-black mt-2 text-slate-900">{data.total_complaints}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-xl text-indigo-600 text-3xl">📊</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Réclamations Urgentes</p>
              <p className="text-4xl font-black mt-2 text-red-600">
                {data.type_counts.Urgent || 0}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl text-red-600 text-3xl">⚠️</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Réclamations Terminées</p>
              <p className="text-4xl font-black mt-2 text-emerald-600">
                {data.complaint_status_counts.Terminer || 0}
              </p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl text-emerald-600 text-3xl">✅</div>
          </div>
        </div>
      </div>

      {/* Charts Section 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600 font-bold">01</span>
            <h3 className="text-xl font-bold text-slate-800">Réclamations par Division</h3>
          </div>
          <div className="h-72">
            <Bar 
              data={divisionChartData} 
              options={{ 
                ...chartOptions,
                plugins: { 
                  ...chartOptions.plugins, 
                  legend: { 
                    display: true,
                    position: 'bottom',
                    labels: {
                      usePointStyle: true,
                      padding: 15,
                      font: { size: 12, family: 'Inter, sans-serif' }
                    }
                  },
                  tooltip: {
                    callbacks: {
                      footer: function(tooltipItems) {
                        if (tooltipItems.length > 0) {
                          const divisionIndex = tooltipItems[0].dataIndex;
                          const total = data.division_values[divisionIndex] || 0;
                          const validated = (data.division_validated || [])[divisionIndex] || 0;
                          const retard = (data.division_retard || [])[divisionIndex] || 0;
                          return [
                            '',
                            `Total: ${total}`,
                            `Validées: ${validated}`,
                            `Retard: ${retard}`
                          ];
                        }
                        return '';
                      }
                    }
                  }
                }
              }} 
            />
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600 font-bold">02</span>
            <h3 className="text-xl font-bold text-slate-800">Réclamations par Type</h3>
          </div>
          <div className="h-72">
            <Doughnut 
              data={typeChartData} 
              options={{
                ...doughnutChartOptions,
                cutout: '70%',
                plugins: {
                  ...doughnutChartOptions.plugins,
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ${value} (${percentage}%)`;
                      }
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Charts Section 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600 font-bold">03</span>
            <h3 className="text-xl font-bold text-slate-800">Statut des Réclamations</h3>
          </div>
          <div className="h-72">
            <Doughnut 
              data={statusChartData} 
              options={{
                ...doughnutChartOptions,
                cutout: '70%',
                plugins: {
                  ...doughnutChartOptions.plugins,
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ${value} (${percentage}%)`;
                      }
                    }
                  }
                }
              }} 
            />
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600 font-bold">04</span>
            <h3 className="text-xl font-bold text-slate-800">Historique (12 derniers mois)</h3>
          </div>
          <div className="h-72">
            <Line 
              data={monthlyChartData} 
              options={chartOptions} 
            />
          </div>
        </div>
      </div>

      {/* Charts Section 3 - Retard Percentage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600 font-bold">05</span>
            <h3 className="text-xl font-bold text-slate-800">Pourcentage de Réclamations en Retard</h3>
          </div>
          <div className="h-72">
            <Doughnut 
              data={retardChartData} 
              options={{
                ...doughnutChartOptions,
                cutout: '70%',
                plugins: {
                  ...doughnutChartOptions.plugins,
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        if (context.label === 'Retard') {
                          return `Retard: ${data.retard_percentage || 0}%`
                        }
                        return `${context.label}: ${context.parsed}%`
                      }
                    }
                  }
                }
              }} 
            />
          </div>
          <div className="mt-4 text-center">
            <p className="text-3xl font-black text-red-600">{data.retard_percentage || 0}%</p>
            <p className="text-sm text-slate-500 mt-1">des réclamations sont en retard</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard