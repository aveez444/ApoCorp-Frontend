// src/components/reports/Icon.jsx
import { ICONS } from './reportConstants'

export default function Icon({ name, size = 14, stroke = 'currentColor', strokeWidth = 2, fill = 'none' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]?.split('M').filter(Boolean).map((d, i) => (
        <path key={i} d={`M${d}`} />
      ))}
    </svg>
  )
}