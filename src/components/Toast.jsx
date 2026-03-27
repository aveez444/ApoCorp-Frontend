import { useEffect, useState } from 'react'

export default function Toast({ message, onClose }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div style={{
      position: 'fixed',
      top: 28,
      right: 28,
      left: 28,
      margin: '0 auto',
      maxWidth: 600,
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: '#fff',
      border: '1px solid #bbf7d0',
      borderLeft: '4px solid #22c55e',
      borderRadius: 8,
      padding: '16px 20px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      fontFamily: 'Lato, sans-serif',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-20px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
    }}>
      {/* Green check icon - slightly larger */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: '#dcfce7',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5}>
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Message with better formatting */}
      <div style={{ flex: 1 }}>
        <span style={{ 
          fontSize: '15px', 
          fontWeight: 600, 
          color: '#15803d',
          display: 'block',
          marginBottom: 2
        }}>
          Success!
        </span>
        <span style={{ 
          fontSize: '14px', 
          fontWeight: 500, 
          color: '#166534',
          lineHeight: 1.5
        }}>
          {message}
        </span>
      </div>

      <button
        onClick={() => { setVisible(false); setTimeout(onClose, 300) }}
        style={{ 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer', 
          color: '#9ca3af', 
          padding: 4,
          flexShrink: 0,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}