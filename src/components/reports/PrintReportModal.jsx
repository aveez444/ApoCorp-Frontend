
import { useState } from 'react'
import { PRIMARY, FONT, MODULE_META } from './reportConstants'
import { btnPrimary, btnOutline } from './reportConstants'
import Icon from './Icon'
import Spinner from './Spinner'

export default function PrintReportModal({ results, config, onClose, onPrint, onDownloadPDF }) {
  const [printLoading, setPrintLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const handlePrint = async () => {
    setPrintLoading(true)
    await onPrint()
    setPrintLoading(false)
  }

  const handlePDF = async () => {
    setPdfLoading(true)
    await onDownloadPDF()
    setPdfLoading(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(18,44,65,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '32px 40px',
        width: 520, maxWidth: '92vw', boxShadow: '0 25px 70px -10px rgba(18,44,65,0.25)',
        animation: 'modalPop 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <style>{`
          @keyframes modalPop {
            0% { opacity: 0; transform: scale(0.95) translateY(20px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: PRIMARY, letterSpacing: '-0.4px' }}>
            Export Report
          </h3>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'none', border: 'none', cursor: 'pointer', 
              fontSize: 28, color: '#94a3b8', lineHeight: 1, padding: 4 
            }}
          >
            ×
          </button>
        </div>

        {/* Modules Used */}
        {config?.modules && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              📁 Modules Included
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {config.modules.map(mod => {
                const meta = MODULE_META[mod] || { label: mod, color: '#64748b', bg: '#f1f5f9' }
                return (
                  <span key={mod} style={{
                    background: meta.bg, color: meta.color,
                    padding: '6px 16px', borderRadius: 9999, fontSize: 13, fontWeight: 600,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                  }}>
                    {meta.label}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Print Options */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Choose export format</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <button
              onClick={handlePrint}
              disabled={printLoading}
              style={{
                ...btnPrimary, background: '#fff', color: PRIMARY,
                border: `2px solid ${PRIMARY}`, height: 64, fontSize: 15, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 4px 12px rgba(18,44,65,0.12)'
              }}
            >
              {printLoading ? <Spinner size={18} /> : <Icon name="print" size={18} />}
              Print Report
            </button>
            <button
              onClick={handlePDF}
              disabled={pdfLoading}
              style={{
                ...btnPrimary, height: 64, fontSize: 15, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 4px 12px rgba(18,44,65,0.12)'
              }}
            >
              {pdfLoading ? <Spinner size={18} color="#fff" /> : <Icon name="download" size={18} />}
              Download PDF
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 40 }}>
          <button 
            onClick={onClose} 
            style={{ ...btnOutline, padding: '12px 28px', fontSize: 14 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}