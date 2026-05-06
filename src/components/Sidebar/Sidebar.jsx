// import { useState } from 'react'
// import { NavLink, useLocation, useNavigate } from 'react-router-dom'
// import { useAuth } from '../../auth/AuthContext'
// import apoCorpLogo from '../../assets/apoCorp-logo.png' // Adjust the path based on your image location

// const employeeNavItems = [
//   {
//     label: 'Dashboard', path: '/employee/dashboard',
//     icon: (
//       <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
//         <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
//       </svg>
//     )
//   },
//   {
//     label: 'Customers', path: '/employee/customers',
//     icon: (
//       <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round"/>
//         <circle cx="9" cy="7" r="4"/>
//         <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round"/>
//       </svg>
//     )
//   },
//   {
//     label: 'Enquiries', path: '/employee/enquiries',
//     icon: (
//       <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
//       </svg>
//     )
//   },
//   {
//     label: 'Quotations', path: '/employee/quotations',
//     icon: (
//       <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
//         <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
//         <line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
//       </svg>
//     )
//   },
//   {
//     label: 'Order Acknowledgements', path: '/employee/order-acknowledgements',
//     icon: (
//       <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round"/>
//         <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" strokeLinejoin="round"/>
//       </svg>
//     )
//   },
//   {
//     label: 'Orders', path: '/employee/orders',
//     icon: (
//       <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round"/>
//         <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
//       </svg>
//     )
//   },
//   {
//     label: 'Proforma Invoice', path: '/employee/proforma-invoice',
//     icon: (
//       <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
//       </svg>
//     )
//   },
//   {
//     label: 'Reports',
//     icon: (
//       <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round"/>
//       </svg>
//     ),
//     children: [
//       { label: 'Reports',      path: '/employee/reports/custom' },
//       { label: 'Visit Reports', path: '/employee/reports/visit-reports' },
//     ]
//   },
// ]

// const managerNavItems = [
//   {
//     label: 'Dashboard', path: '/manager/dashboard',
//     icon: (
//       <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
//         <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
//       </svg>
//     )
//   },
//   {
//     label: 'Customers', path: '/manager/customers',
//     icon: (
//       <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round"/>
//         <circle cx="9" cy="7" r="4"/>
//         <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round"/>
//       </svg>
//     )
//   },

//   {
//     label: 'Enquiries', path: '/manager/enquiries',
//     icon: (
//       <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
//       </svg>
//     )
//   },
//   {
//     label: 'Quotations', path: '/manager/quotations',
//     icon: (
//       <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <path d="M9 12h6m-6 4h6m2-10H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
//         <path d="M9 6V4m6 2V4" strokeLinecap="round" strokeLinejoin="round"/>
//       </svg>
//     )
//   },
//   {
//     label: 'Order Acknowledgements', path: '/manager/order-acknowledgements',
//     icon: (
//       <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round"/>
//         <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" strokeLinejoin="round"/>
//       </svg>
//     )
//   },
//   {
//     label: 'Orders', path: '/manager/orders',
//     icon: (
//       <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round"/>
//         <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
//       </svg>
//     )
//   },
//   {
//     label: 'Proforma Invoice', path: '/manager/proforma-invoice',
//     icon: (
//       <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
//       </svg>
//     )
//   },
//   {
//     label: 'Permissions', path: '/manager/permissions',
//     icon: (
//       <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
//         <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round"/>
//       </svg>
//     )
//   },
//   {
//     label: 'Reports',
//     icon: (
//       <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round"/>
//       </svg>
//     ),
//     children: [
//       { label: 'Reports',      path: '/manager/reports/custom' },
//       { label: 'Visit Reports', path: '/manager/reports/visit-reports' },
//     ]
//   },
// ]

// /* ── Chevron icon ── */
// function Chevron({ open }) {
//   return (
//     <svg
//       width="12" height="12" fill="none" viewBox="0 0 24 24"
//       stroke="currentColor" strokeWidth={2.5}
//       style={{ transition: 'transform .2s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}
//     >
//       <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
//     </svg>
//   )
// }

// export default function Sidebar({ role = 'employee' }) {
//   const [collapsed, setCollapsed] = useState(false)
//   const [openGroups, setOpenGroups] = useState({ Reports: true })   // Reports open by default
//   const { logout } = useAuth()
//   const navigate   = useNavigate()
//   const location   = useLocation()

//   const navItems    = role === 'manager' ? managerNavItems : employeeNavItems
//   const sectionLabel = role === 'manager' ? 'Management' : 'Sales & Marketing'

//   const handleLogout = async () => {
//     await logout()
//     navigate('/login')
//   }

//   const toggleGroup = label => {
//     setOpenGroups(p => ({ ...p, [label]: !p[label] }))
//   }

//   // Check if any child of a group is currently active
//   const groupIsActive = (children) =>
//     children?.some(c => location.pathname.startsWith(c.path))

//   return (
//     <aside style={{
//       width: collapsed ? 68 : 220, // Slightly wider for better logo visibility
//       minWidth: collapsed ? 68 : 220,
//       height: '100vh',
//       background: '#0d1b35',
//       display: 'flex',
//       flexDirection: 'column',
//       transition: 'width 0.25s ease, min-width 0.25s ease',
//       overflow: 'hidden',
//       flexShrink: 0,
//       borderRight: '1px solid rgba(255,255,255,0.05)',
//     }}>

// {/* Logo container - increased minHeight */}
// <div style={{
//   display: 'flex',
//   alignItems: 'center',
//   justifyContent: collapsed ? 'center' : 'space-between',
//   padding: collapsed ? '16px 0' : '20px 16px', // More padding
//   minHeight: 100, // Increased from 80
//   borderBottom: '1px solid rgba(255,255,255,0.06)',
// }}>

// {!collapsed && (
//   <div style={{ 
//     display: 'flex', 
//     alignItems: 'center', 
//     justifyContent: 'center', // Center it
//     width: '100%',
//     padding: '8px 0',
//   }}>
//     <img 
//       src={apoCorpLogo} 
//       alt="ApoCorp" 
//       style={{
//         width: '100%', // Full width
//         height: 'auto',
//         maxHeight: '100px', // Tall but capped
//         objectFit: 'contain',
//       }}
//     />
//   </div>
// )}
//         {!collapsed && (
//           <button onClick={() => setCollapsed(true)}
//             style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 4, display: 'flex', flexShrink: 0 }}>
//             <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//               <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
//             </svg>
//           </button>
//         )}
//       </div>

//       {/* Section label */}
//       {!collapsed && (
//         <div style={{ padding: '14px 16px 6px' }}>
//           <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
//             {sectionLabel}
//           </span>
//         </div>
//       )}

//       {/* Expand button when collapsed */}
//       {collapsed && (
//         <button onClick={() => setCollapsed(false)}
//           style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//           <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//             <path d="M13 5l7 7-7 7M6 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
//           </svg>
//         </button>
//       )}

//       {/* Nav */}
//       <nav style={{ flex: 1, padding: '4px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
//         {navItems.map((item) => {

//           /* ── Group item (has children) ── */
//           if (item.children) {
//             const isOpen    = !!openGroups[item.label]
//             const hasActive = groupIsActive(item.children)

//             return (
//               <div key={item.label}>
//                 {/* Group header */}
//                 <button
//                   onClick={() => { if (collapsed) { setCollapsed(false); setOpenGroups(p => ({ ...p, [item.label]: true })) } else toggleGroup(item.label) }}
//                   title={collapsed ? item.label : undefined}
//                   style={{
//                     display: 'flex', alignItems: 'center',
//                     gap: 10,
//                     padding: collapsed ? '10px 0' : '9px 10px',
//                     justifyContent: collapsed ? 'center' : 'flex-start',
//                     width: '100%', borderRadius: 8, border: 'none',
//                     background: hasActive ? 'rgba(255,255,255,0.09)' : 'transparent',
//                     cursor: 'pointer',
//                     color: hasActive ? '#fff' : 'rgba(255,255,255,0.45)',
//                     fontSize: '0.82rem', fontWeight: hasActive ? 600 : 400,
//                     transition: 'all 0.15s', marginBottom: 2,
//                     textAlign: 'left',
//                   }}
//                   onMouseEnter={e => { if (!hasActive) { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' } }}
//                   onMouseLeave={e => { if (!hasActive) { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'transparent' } }}
//                 >
//                   <span style={{ color: hasActive ? '#93c5fd' : 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
//                     {item.icon}
//                   </span>
//                   {!collapsed && (
//                     <>
//                       <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
//                         {item.label}
//                       </span>
//                       <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
//                         <Chevron open={isOpen} />
//                       </span>
//                     </>
//                   )}
//                 </button>

//                 {/* Children */}
//                 {!collapsed && isOpen && (
//                   <div style={{ marginBottom: 4, overflow: 'hidden' }}>
//                     {item.children.map(child => (
//                       <NavLink
//                         key={child.path}
//                         to={child.path}
//                         style={({ isActive }) => ({
//                           display: 'flex', alignItems: 'center', gap: 8,
//                           padding: '7px 10px 7px 36px',
//                           borderRadius: 7, marginBottom: 1,
//                           textDecoration: 'none', fontSize: '0.80rem',
//                           fontWeight: isActive ? 600 : 400,
//                           color: isActive ? '#93c5fd' : 'rgba(255,255,255,0.40)',
//                           background: isActive ? 'rgba(147,197,253,0.10)' : 'transparent',
//                           transition: 'all 0.15s',
//                           position: 'relative',
//                         })}
//                         onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
//                         onMouseLeave={e => {
//                           const active = location.pathname.startsWith(child.path)
//                           e.currentTarget.style.color = active ? '#93c5fd' : 'rgba(255,255,255,0.40)'
//                           e.currentTarget.style.background = active ? 'rgba(147,197,253,0.10)' : 'transparent'
//                         }}
//                       >
//                         {/* Left accent line */}
//                         <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', width: 1, height: 12, background: 'rgba(255,255,255,0.15)', borderRadius: 1 }} />
//                         {child.label}
//                       </NavLink>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             )
//           }

//           /* ── Regular nav item ── */
//           return (
//             <NavLink
//               key={item.label}
//               to={item.path}
//               title={collapsed ? item.label : undefined}
//               style={({ isActive }) => ({
//                 display: 'flex', alignItems: 'center', gap: 10,
//                 padding: collapsed ? '10px 0' : '9px 10px',
//                 justifyContent: collapsed ? 'center' : 'flex-start',
//                 borderRadius: 8, marginBottom: 2,
//                 textDecoration: 'none',
//                 color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
//                 background: isActive ? 'rgba(255,255,255,0.09)' : 'transparent',
//                 transition: 'all 0.15s', fontSize: '0.82rem',
//                 fontWeight: isActive ? 600 : 400,
//               })}
//               onMouseEnter={e => { if (!e.currentTarget.getAttribute('aria-current')) { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' } }}
//               onMouseLeave={e => { if (!e.currentTarget.getAttribute('aria-current')) { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'transparent' } }}
//             >
//               {({ isActive }) => (
//                 <>
//                   <span style={{ color: isActive ? '#93c5fd' : 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
//                     {item.icon}
//                   </span>
//                   {!collapsed && (
//                     <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
//                       {item.label}
//                     </span>
//                   )}
//                 </>
//               )}
//             </NavLink>
//           )
//         })}
//       </nav>

//       {/* Logout */}
//       <div style={{ padding: '8px 8px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
//         <button
//           onClick={handleLogout}
//           title={collapsed ? 'Logout' : undefined}
//           style={{
//             display: 'flex', alignItems: 'center', gap: 10,
//             padding: collapsed ? '10px 0' : '9px 10px',
//             justifyContent: collapsed ? 'center' : 'flex-start',
//             width: '100%', borderRadius: 8, border: 'none',
//             background: 'transparent', cursor: 'pointer',
//             color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem',
//             transition: 'all 0.15s',
//           }}
//           onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
//           onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'transparent' }}
//         >
//           <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ flexShrink: 0 }}>
//             <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
//           </svg>
//           {!collapsed && <span>Logout</span>}
//         </button>
//       </div>
//     </aside>
//   )
// }

















import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import apoCorpLogo from '../../assets/apoCorp-logo.png'

/* ─────────────────────────────────────────────
   SVG ICONS
───────────────────────────────────────────── */
const Icons = {
  dashboard: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  customers: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round"/>
    </svg>
  ),
  enquiries: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  quotations: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  ),
  orderAck: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  orders: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  proforma: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  ),
  reports: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  permissions: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round"/>
    </svg>
  ),
  // Logistics icons
  outboundFulfilment: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  backOrder: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="12" y1="22.08" x2="12" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  orderTracking: (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  orderLogistics: (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="22.08" x2="12" y2="12" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
),

}

/* ─────────────────────────────────────────────
   NAV STRUCTURE
   Each top-level entry is a MODULE (has `children` which are nav items).
   Nav items themselves can also have `children` (sub-dropdown).
───────────────────────────────────────────── */

const buildNavModules = (role) => {
  const r = role === 'manager' ? 'manager' : 'employee'

  const salesAndMarketing = {
    moduleLabel: 'Sales & Marketing',
    items: [
      { label: 'Dashboard',               path: `/${r}/dashboard`,                icon: Icons.dashboard },
      { label: 'Customers',               path: `/${r}/customers`,                icon: Icons.customers },
      { label: 'Enquiries',               path: `/${r}/enquiries`,                icon: Icons.enquiries },
      { label: 'Quotations',              path: `/${r}/quotations`,               icon: Icons.quotations },
      { label: 'Order Acknowledgements',  path: `/${r}/order-acknowledgements`,   icon: Icons.orderAck },
      { label: 'Orders',                  path: `/${r}/orders`,                   icon: Icons.orders },
      { label: 'Proforma Invoice',        path: `/${r}/proforma-invoice`,         icon: Icons.proforma },
      ...(role === 'manager' ? [{ label: 'Permissions', path: `/${r}/permissions`, icon: Icons.permissions }] : []),
      {
        label: 'Reports',
        icon: Icons.reports,
        children: [
          { label: 'Reports',       path: `/${r}/reports/custom` },
          { label: 'Visit Reports', path: `/${r}/reports/visit-reports` },
        ],
      },
    ],
  }

  const logistics = {
    moduleLabel: 'Logistics & Procurement',
    items: [
      { label: 'Dashboard', path: `/${r}/logistics/dashboard`, icon: Icons.dashboard },
      {
        label: 'Outbound Fulfilment',
        icon: Icons.outboundFulfilment,
        children: [
          { label: 'Pending Invoice List', path: `/${r}/logistics/pending-invoices` },
          { label: 'Invoices',             path: `/${r}/logistics/invoices` },
        ],
      },
      { label: 'Back Order',         path: `/${r}/logistics/back-orders`,     icon: Icons.backOrder },
      { label: 'Order Tracking',     path: `/${r}/logistics/order-tracking`,   icon: Icons.orderTracking },
      { label: 'Order Logistics',    path: `/${r}/logistics/order-logistics`,  icon: Icons.orderLogistics },  // ← ADD THIS
      {
        label: 'Reports',
        icon: Icons.reports,
        children: [
          { label: 'Reports',              path: `/${r}/reports/custom` },
          { label: 'Logistics Reports',    path: `/${r}/logistics/reports/logistics` },
        ],
      },
    ],
  }

  return [salesAndMarketing, logistics]
}

/* ─────────────────────────────────────────────
   CHEVRON
───────────────────────────────────────────── */
function Chevron({ open }) {
  return (
    <svg
      width="12" height="12" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={2.5}
      style={{ transition: 'transform .2s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}
    >
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/* ─────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────── */
export default function Sidebar({ role = 'employee' }) {
  const [collapsed, setCollapsed]     = useState(false)
  // Track which module sections are open: e.g. { 'Sales & Marketing': true, 'Logistics & Procurement': false }
  const [openModules, setOpenModules] = useState({ 'Sales & Marketing': true, 'Logistics & Procurement': false })
  // Track which sub-dropdowns (like Reports, Outbound Fulfilment) are open
  const [openGroups, setOpenGroups]   = useState({ Reports: true })

  const { logout } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()

  const navModules = buildNavModules(role)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const toggleModule = (label) => setOpenModules(p => ({ ...p, [label]: !p[label] }))
  const toggleGroup  = (label) => setOpenGroups(p => ({ ...p, [label]: !p[label] }))

  const groupIsActive = (children) =>
    children?.some(c => location.pathname.startsWith(c.path))

  /* ── Renders a single nav item (may have sub-children) ── */
  const renderItem = (item) => {
    if (item.children) {
      const isOpen    = !!openGroups[item.label]
      const hasActive = groupIsActive(item.children)

      return (
        <div key={item.label}>
          <button
            onClick={() => {
              if (collapsed) { setCollapsed(false); setOpenGroups(p => ({ ...p, [item.label]: true })) }
              else toggleGroup(item.label)
            }}
            title={collapsed ? item.label : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '10px 0' : '9px 10px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              width: '100%', borderRadius: 8, border: 'none',
              background: hasActive ? 'rgba(255,255,255,0.09)' : 'transparent',
              cursor: 'pointer',
              color: hasActive ? '#fff' : 'rgba(255,255,255,0.45)',
              fontSize: '0.82rem', fontWeight: hasActive ? 600 : 400,
              transition: 'all 0.15s', marginBottom: 2, textAlign: 'left',
            }}
            onMouseEnter={e => { if (!hasActive) { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' } }}
            onMouseLeave={e => { if (!hasActive) { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'transparent' } }}
          >
            <span style={{ color: hasActive ? '#93c5fd' : 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
              {item.icon}
            </span>
            {!collapsed && (
              <>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
                  <Chevron open={isOpen} />
                </span>
              </>
            )}
          </button>

          {!collapsed && isOpen && (
            <div style={{ marginBottom: 4 }}>
              {item.children.map(child => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 10px 7px 36px',
                    borderRadius: 7, marginBottom: 1,
                    textDecoration: 'none', fontSize: '0.80rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#93c5fd' : 'rgba(255,255,255,0.40)',
                    background: isActive ? 'rgba(147,197,253,0.10)' : 'transparent',
                    transition: 'all 0.15s', position: 'relative',
                  })}
                  onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => {
                    const active = location.pathname.startsWith(child.path)
                    e.currentTarget.style.color = active ? '#93c5fd' : 'rgba(255,255,255,0.40)'
                    e.currentTarget.style.background = active ? 'rgba(147,197,253,0.10)' : 'transparent'
                  }}
                >
                  <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', width: 1, height: 12, background: 'rgba(255,255,255,0.15)', borderRadius: 1 }} />
                  {child.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      )
    }

    /* Regular nav item */
    return (
      <NavLink
        key={item.label}
        to={item.path}
        title={collapsed ? item.label : undefined}
        style={({ isActive }) => ({
          display: 'flex', alignItems: 'center', gap: 10,
          padding: collapsed ? '10px 0' : '9px 10px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderRadius: 8, marginBottom: 2,
          textDecoration: 'none',
          color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
          background: isActive ? 'rgba(255,255,255,0.09)' : 'transparent',
          transition: 'all 0.15s', fontSize: '0.82rem',
          fontWeight: isActive ? 600 : 400,
        })}
        onMouseEnter={e => { if (!e.currentTarget.getAttribute('aria-current')) { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' } }}
        onMouseLeave={e => { if (!e.currentTarget.getAttribute('aria-current')) { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'transparent' } }}
      >
        {({ isActive }) => (
          <>
            <span style={{ color: isActive ? '#93c5fd' : 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
              {item.icon}
            </span>
            {!collapsed && (
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.label}
              </span>
            )}
          </>
        )}
      </NavLink>
    )
  }

  /* ── Check if any item in a module has an active path ── */
  const moduleIsActive = (items) =>
    items.some(item =>
      item.path
        ? location.pathname.startsWith(item.path)
        : item.children?.some(c => location.pathname.startsWith(c.path))
    )

  return (
    <aside style={{
      width: collapsed ? 68 : 220,
      minWidth: collapsed ? 68 : 220,
      height: '100vh',
      background: '#0d1b35',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s ease, min-width 0.25s ease',
      overflow: 'hidden',
      flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.05)',
    }}>

      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '16px 0' : '20px 16px',
        minHeight: 100,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '8px 0' }}>
            <img
              src={apoCorpLogo}
              alt="ApoCorp"
              style={{ width: '100%', height: 'auto', maxHeight: '100px', objectFit: 'contain' }}
            />
          </div>
        )}

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 4, display: 'flex', flexShrink: 0 }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M13 5l7 7-7 7M6 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Nav — scrollable */}
      <nav style={{ flex: 1, padding: '4px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {navModules.map((module) => {
          const isModuleOpen   = !!openModules[module.moduleLabel]
          const hasModuleActive = moduleIsActive(module.items)

          return (
            <div key={module.moduleLabel} style={{ marginBottom: 4 }}>

              {/* ── Module header (collapsible section) ── */}
              {!collapsed ? (
                <button
                  onClick={() => toggleModule(module.moduleLabel)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '8px 6px 6px',
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    color: hasModuleActive ? 'rgba(147,197,253,0.85)' : 'rgba(255,255,255,0.25)',
                    fontSize: '0.60rem', fontWeight: 700, letterSpacing: '0.10em',
                    textTransform: 'uppercase', transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = hasModuleActive ? 'rgba(147,197,253,0.85)' : 'rgba(255,255,255,0.25)'
                  }}
                >
                  <span>{module.moduleLabel}</span>
                  <Chevron open={isModuleOpen} />
                </button>
              ) : (
                /* Collapsed: show a thin divider line instead of the label */
                <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '8px 4px' }} />
              )}

              {/* ── Module items ── */}
              {(isModuleOpen || collapsed) && (
                <div>
                  {module.items.map(renderItem)}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '8px 8px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: collapsed ? '10px 0' : '9px 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            width: '100%', borderRadius: 8, border: 'none',
            background: 'transparent', cursor: 'pointer',
            color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'transparent' }}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ flexShrink: 0 }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}