import { useEffect, useState, useCallback } from 'react'
import api from '../../api/axios'
import banner from '../../assets/dashboard-banner.png'
import Toast from '../../components/Toast'
import { PRIMARY, BORDER, FONT, btnOutline, fmt } from '../../components/reports/reportConstants'
import Icon from '../../components/reports/Icon'
import Spinner from '../../components/reports/Spinner'
import ReportSidebar from '../../components/reports/ReportSidebar'
import ReportBuilder from '../../components/reports/ReportBuilder'
import ReportResults from '../../components/reports/ReportResults'
import SaveReportModal from '../../components/reports/SaveReportModal'
import PrintReportModal from '../../components/reports/PrintReportModal'
import { printReport, downloadPDF } from '../../components/reports/printReportUtils'

export default function CustomReports({ role = 'employee' }) {
  const [registry, setRegistry] = useState(null)
  const [savedReports, setSavedReports] = useState([])
  const [activeReport, setActiveReport] = useState(null)
  const [loadingRegistry, setLoadingRegistry] = useState(true)

  // Builder state
  const [selectedModules, setSelectedModules] = useState(['enquiry'])
  const [selectedColumns, setSelectedColumns] = useState([])
  const [filters, setFilters] = useState([])
  const [orderBy, setOrderBy] = useState('-created_at')

  // Results state
  const [results, setResults] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [running, setRunning] = useState(false)

  // UI state
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [toast, setToast] = useState(null)
  const [searchSaved, setSearchSaved] = useState('')
  const [activeTab, setActiveTab] = useState('builder')

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 3800) }

  // Load registry + saved reports
  useEffect(() => {
    setLoadingRegistry(true)
    Promise.all([
      api.get('/custom-reports/fields/'),
      api.get('/custom-reports/saved/'),
    ]).then(([regRes, savedRes]) => {
      setRegistry(regRes.data)
      setSavedReports(savedRes.data?.results || savedRes.data || [])
    }).catch(console.error)
      .finally(() => setLoadingRegistry(false))
  }, [])

  // Flattened field list for filters
  const allFields = registry
    ? Object.entries(registry.fields).flatMap(([mod, fields]) =>
        fields.map(f => ({ ...f, module: mod }))
      )
    : []

  // Build config from builder state
  const buildConfig = useCallback(() => ({
    modules: selectedModules && selectedModules.length ? selectedModules : ['enquiry'],
    columns: selectedColumns || [],
    filters: (filters || []).filter(f => f.field && f.value !== '' && f.value !== undefined && f.value !== null),
    order_by: orderBy || '-created_at',
  }), [selectedModules, selectedColumns, filters, orderBy])

  // Run report
  const runReport = useCallback(async (configOverride = null, page = 1) => {
    const config = configOverride || buildConfig()
    if (!config || !config.columns || !config.columns.length) {
      showToast('Please select at least one column to run the report.')
      return
    }
    setRunning(true)
    setActiveTab('results')
    try {
      const res = await api.post('/custom-reports/run/', { config, page, page_size: 50 })
      setResults({ ...res.data, config })
      setCurrentPage(page)
    } catch (e) {
      console.error('Report run error:', e)
      showToast('Failed to run report. Please check your filters.')
    } finally {
      setRunning(false)
    }
  }, [buildConfig])

  // Run saved report
  const runSaved = async (report) => {
    if (loadingRegistry) {
      showToast('Please wait, report builder is still loading...')
      return
    }
    
    if (!report) {
      showToast('Invalid report')
      return
    }
    
    setActiveReport(report.id)
    
    let cfg = report.config
    
    if (typeof cfg === 'string') {
      try {
        cfg = JSON.parse(cfg)
      } catch (e) {
        console.error('Failed to parse config:', e)
        showToast('Invalid report configuration format')
        return
      }
    }
    
    if (!cfg || typeof cfg !== 'object') {
      if (report.modules || report.columns || report.filters) {
        cfg = {
          modules: report.modules || ['enquiry'],
          columns: report.columns || [],
          filters: report.filters || [],
          order_by: report.order_by || '-created_at'
        }
      } else {
        console.error('Invalid config structure:', report)
        showToast('Invalid report configuration. Please recreate this report.')
        return
      }
    }
    
    setSelectedModules(cfg.modules || ['enquiry'])
    setSelectedColumns(cfg.columns || [])
    setFilters(cfg.filters || [])
    setOrderBy(cfg.order_by || '-created_at')
    
    setTimeout(() => {
      runReport(cfg)
    }, 120)
  }

  const handlePrintPDF = () => {
    if (results && results.rows.length > 0) {
      setShowPrintModal(true)
    }
  }

  // Download Excel - Fixed version without problematic Accept header
  const downloadExcel = async () => {
    const config = buildConfig()
    if (!config.columns?.length) { 
      showToast('Select at least one column first.')
      return 
    }
    
    setDownloading(true)
    try {
      // Remove the Accept header that was causing 406
      const res = await api.post('/custom-reports/run-excel/', 
        { 
          config, 
          filename: `report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`,
          sheet_title: 'Report Data'
        },
        { 
          responseType: 'blob'
          // Remove the Accept header - let axios handle it
        }
      )
      
      // Create blob and trigger download
      const blob = new Blob([res.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `custom_report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      showToast('✅ Excel file downloaded successfully')
    } catch (err) {
      console.error('Download error:', err)
      let errorMsg = 'Download failed. '
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text()
          const parsed = JSON.parse(text)
          errorMsg = parsed.message || parsed.error || text
        } catch {
          errorMsg = 'Unknown error occurred'
        }
      } else {
        errorMsg = err.response?.data?.message || err.message || 'Unknown error'
      }
      showToast('Excel download failed. ' + errorMsg)
    } finally {
      setDownloading(false)
    }
  }


  // Print report
  const handlePrintReport = () => {
    if (results && results.rows.length > 0) {
      printReport(results, buildConfig(), activeReport ? savedReports.find(r => r.id === activeReport)?.name || 'Custom Report' : 'Custom Report')
      setShowPrintModal(false)
    }
  }

  // Download PDF
  const handleDownloadPDF = () => {
    if (results && results.rows.length > 0) {
      downloadPDF(results, buildConfig(), activeReport ? savedReports.find(r => r.id === activeReport)?.name || 'Custom Report' : 'Custom Report')
      setShowPrintModal(false)
    }
  }

  // Save report (now callable from both tabs)
  const saveReport = async ({ name, description, is_shared }) => {
    setSaving(true)
    try {
      const config = buildConfig()
      const safeConfig = {
        modules: config.modules || ['enquiry'],
        columns: config.columns || [],
        filters: (config.filters || []).filter(f => f.field && f.value !== '' && f.value !== undefined),
        order_by: config.order_by || '-created_at',
      }
      
      const res = await api.post('/custom-reports/saved/', { 
        name, description, is_shared, config: safeConfig 
      })
      setSavedReports(prev => [res.data, ...prev])
      setShowSaveModal(false)
      showToast(`Report "${name}" saved successfully`)
    } catch (err) {
      console.error('Save failed:', err)
      showToast('Failed to save report. ' + (err.response?.data?.message || 'Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  // Delete saved report
  const deleteReport = async (id) => {
    if (!confirm('Delete this saved report?')) return
    try {
      await api.delete(`/custom-reports/saved/${id}/`)
      setSavedReports(prev => prev.filter(r => r.id !== id))
      if (activeReport === id) setActiveReport(null)
      showToast('Report deleted.')
    } catch {
      showToast('Failed to delete report.')
    }
  }

  // Duplicate saved report
  const duplicateReport = async (report) => {
    try {
      const res = await api.post(`/custom-reports/saved/${report.id}/duplicate/`, { name: `${report.name} (Copy)` })
      setSavedReports(prev => [res.data, ...prev])
      showToast(`Duplicated as "${res.data.name}".`)
    } catch {
      showToast('Failed to duplicate report.')
    }
  }

  // Column management
  const toggleColumn = (mod, field, label) => {
    const exists = selectedColumns.find(c => c.module === mod && c.field === field)
    if (exists) {
      setSelectedColumns(prev => prev.filter(c => !(c.module === mod && c.field === field)))
    } else {
      setSelectedColumns(prev => [...prev, { module: mod, field, label }])
    }
  }

  const removeColumn = (mod, field) => {
    setSelectedColumns(prev => prev.filter(c => !(c.module === mod && c.field === field)))
  }

  const isColSelected = (mod, field) => selectedColumns.some(c => c.module === mod && c.field === field)

  // Module toggle
  const toggleModule = (modKey) => {
    if (modKey === 'enquiry') return
    setSelectedModules(prev => {
      if (prev.includes(modKey)) {
        setSelectedColumns(cols => cols.filter(c => c.module !== modKey))
        return prev.filter(m => m !== modKey)
      }
      return [...prev, modKey]
    })
  }

  // Filter management
  const addFilter = () => {
    setFilters(prev => [...prev, { module: 'enquiry', field: '', operator: 'eq', value: '' }])
  }
  const updateFilter = (idx, key, val) => {
    setFilters(prev => prev.map((f, i) => {
      if (i !== idx) return f
      const updated = { ...f, [key]: val }
      if (key === 'module') { updated.field = ''; updated.value = '' }
      if (key === 'field') { updated.value = ''; updated.operator = 'eq' }
      return updated
    }))
  }
  const removeFilter = idx => setFilters(prev => prev.filter((_, i) => i !== idx))

  return (
    <div style={{ fontFamily: FONT, background: '#f8fafc', minHeight: '100vh', padding: '24px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .cr-tab { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .cr-tab:hover { background: #f1f5f9 !important; }
        .cr-tab-active { background: ${PRIMARY} !important; color: #fff !important; box-shadow: 0 4px 12px rgba(18,44,65,0.3); }
      `}</style>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {showSaveModal && <SaveReportModal onSave={saveReport} onClose={() => setShowSaveModal(false)} loading={saving} />}
      {showPrintModal && results && (
        <PrintReportModal 
          results={results} 
          config={buildConfig()}
          onClose={() => setShowPrintModal(false)}
          onPrint={handlePrintReport}
          onDownloadPDF={handleDownloadPDF}
        />
      )}

      {/* Modern Banner */}
      <div style={{
        backgroundImage: `url(${banner})`, backgroundSize: 'cover', backgroundPosition: 'center',
        borderRadius: 20, padding: '32px 40px', position: 'relative', marginBottom: 28,
        boxShadow: '0 10px 30px -10px rgba(18,44,65,0.3)'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(18,44,65,0.85), rgba(18,44,65,0.65))', borderRadius: 20 }} />
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ 
              color: '#fff', fontSize: 30, margin: '0 0 6px', fontWeight: 700, 
              letterSpacing: '-0.6px' 
            }}>
              Custom Reports
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: 15, maxWidth: 420 }}>
              Build powerful, reusable reports across Enquiries, Customers, Quotations and more
            </p>
          </div>
          <button
            onClick={() => { 
              setActiveReport(null); 
              setSelectedColumns([]); 
              setFilters([]); 
              setResults(null); 
              setActiveTab('builder') 
            }}
            style={{ 
              ...btnOutline, background: 'rgba(255,255,255,0.15)', color: '#fff', 
              border: '2px solid rgba(255,255,255,0.4)', padding: '12px 24px', fontSize: 14 
            }}
          >
            <Icon name="plus" size={16} /> New Report
          </button>
        </div>
      </div>

      {/* Main Layout - Modern split view */}
      <div style={{ display: 'grid', gridTemplateColumns: '272px 1fr', gap: 24 }}>

        {/* Sidebar - Saved Reports */}
        <ReportSidebar
          savedReports={savedReports}
          loadingRegistry={loadingRegistry}
          activeReport={activeReport}
          onRunSaved={runSaved}
          onDeleteReport={deleteReport}
          onDuplicateReport={duplicateReport}
          searchSaved={searchSaved}
          setSearchSaved={setSearchSaved}
        />

        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Modern Tabs + Global Actions */}
          <div style={{ 
            background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14, 
            padding: 6, display: 'flex', alignItems: 'center', gap: 4, 
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)', width: 'fit-content' 
          }}>
            {[{ key: 'builder', label: 'Builder', icon: 'filter' }, { key: 'results', label: 'Results', icon: 'table' }].map(tab => (
              <button 
                key={tab.key}
                className={`cr-tab${activeTab === tab.key ? ' cr-tab-active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 24px', border: 'none', borderRadius: 10, cursor: 'pointer',
                  fontSize: 14, fontWeight: 600, fontFamily: FONT,
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}
              >
                <Icon name={tab.icon} size={16} />
                {tab.label}
                {tab.key === 'results' && results && (
                  <span style={{
                    background: activeTab === 'results' ? 'rgba(255,255,255,0.3)' : '#e2e8f0',
                    color: activeTab === 'results' ? '#fff' : '#475569',
                    borderRadius: 9999, padding: '2px 9px', fontSize: 12, fontWeight: 700,
                  }}>
                    {fmt(results.total)}
                  </span>
                )}
              </button>
            ))}

            {/* Global action buttons - always visible when relevant */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, paddingRight: 8 }}>
              {/* Save Report - now available in BOTH tabs */}
              <button
                onClick={() => setShowSaveModal(true)}
                disabled={activeTab === 'builder' && selectedColumns.length === 0}
                style={{
                  ...btnOutline,
                  padding: '10px 20px',
                  fontSize: 13.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  opacity: (activeTab === 'builder' && selectedColumns.length === 0) ? 0.5 : 1,
                }}
              >
                <Icon name="save" size={15} />
                Save Report
              </button>

              {/* Print / PDF - only when results exist */}
              {results && results.rows.length > 0 && (
                <button
                  onClick={() => setShowPrintModal(true)}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontSize: 13.5,
                    fontWeight: 600,
                    fontFamily: FONT,
                    background: '#f1f5f9',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                >
                  <Icon name="print" size={15} />
                  Print / PDF
                </button>
              )}
            </div>
          </div>

          {/* Builder Tab */}
          {activeTab === 'builder' && (
            <ReportBuilder
              loadingRegistry={loadingRegistry}
              registry={registry}
              selectedModules={selectedModules}
              toggleModule={toggleModule}
              selectedColumns={selectedColumns}
              setSelectedColumns={setSelectedColumns}
              removeColumn={removeColumn}
              isColSelected={isColSelected}
              toggleColumn={toggleColumn}
              filters={filters}
              addFilter={addFilter}
              updateFilter={updateFilter}
              removeFilter={removeFilter}
              allFields={allFields}
              orderBy={orderBy}
              setOrderBy={setOrderBy}
              runReport={runReport}
              setShowSaveModal={setShowSaveModal}
              running={running}
              selectedColumnsLength={selectedColumns.length}
            />
          )}
          
          {/* Results Tab - now with clean scroll handling */}
          {activeTab === 'results' && (
            <ReportResults
              results={results}
              running={running}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              runReport={runReport}
              downloadExcel={downloadExcel}
              setActiveTab={setActiveTab}
              downloading={downloading}
              onPrintPDF={handlePrintPDF}  // Add this prop
            />
          )}
        </div>
      </div>
    </div>
  )
}