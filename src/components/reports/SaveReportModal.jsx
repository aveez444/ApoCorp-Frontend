// src/components/reports/SaveReportModal.jsx
import { useState } from 'react'
import { PRIMARY, FONT, inputStyle, btnPrimary, btnOutline } from './reportConstants'
import Icon from './Icon'
import Spinner from './Spinner'

export default function SaveReportModal({ onSave, onClose, loading }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [shared, setShared] = useState(true)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: '28px 32px',
        width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: PRIMARY }}>Save Report</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>Give this report a name to save it for later use.</p>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Report Name *</label>
          <input
            autoFocus
            placeholder="e.g. Tier A Pipeline Q1"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && onSave({ name, description: desc, is_shared: shared })}
            style={{ ...inputStyle, fontSize: 13, padding: '10px 12px' }}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Description (optional)</label>
          <textarea
            placeholder="What does this report show?"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            rows={2}
            style={{ ...inputStyle, fontSize: 13, padding: '10px 12px', resize: 'vertical' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 500 }}>
            <input type="checkbox" checked={shared} onChange={e => setShared(e.target.checked)}
              style={{ width: 15, height: 15, accentColor: PRIMARY, cursor: 'pointer' }}
            />
            Share with team
          </label>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...btnOutline, padding: '9px 20px' }}>Cancel</button>
          <button
            onClick={() => name.trim() && onSave({ name, description: desc, is_shared: shared })}
            disabled={!name.trim() || loading}
            style={{ ...btnPrimary, padding: '9px 20px', opacity: (!name.trim() || loading) ? 0.6 : 1 }}
          >
            {loading ? <Spinner size={14} color="#fff" /> : <Icon name="save" size={14} />}
            Save Report
          </button>
        </div>
      </div>
    </div>
  )
}