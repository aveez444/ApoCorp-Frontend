// src/components/reports/Spinner.jsx
import { PRIMARY } from './reportConstants'

export default function Spinner({ size = 16, color = PRIMARY }) {
  return (
    <>
      <style>{`@keyframes cr-spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{
        width: size, height: size,
        border: `2px solid #e5e7eb`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'cr-spin 0.7s linear infinite',
        flexShrink: 0,
      }} />
    </>
  )
}