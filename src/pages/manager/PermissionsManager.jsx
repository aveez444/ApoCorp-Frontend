import { useEffect, useState, useCallback } from 'react'
import api from '../../api/axios'
import banner from '../../assets/dashboard-banner.png'

const PRIMARY = '#122C41'
const ACCENT  = '#1e88e5'
const FONT    = "'DM Sans', 'Segoe UI', sans-serif"

/* ── tiny SVG icon helper ── */
const Icon = ({ d, size = 16, color = 'currentColor', fill = 'none', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ic = {
  shield:   'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  user:     'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  check:    'M20 6L9 17l-5-5',
  x:        'M18 6L6 18M6 6l12 12',
  plus:     'M12 5v14M5 12h14',
  minus:    'M5 12h14',
  chevronR: 'M9 18l6-6-6-6',
  chevronL: 'M15 18l-6-6 6-6',
  search:   'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  lock:     'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4',
  eye:      'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  tag:      'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01',
  trash:    'M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2',
  refresh:  'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
}

const APP_COLORS = {
  customers:   { bg: '#e8f5e9', color: '#2e7d32', label: 'Customers' },
  enquiries:   { bg: '#e3f2fd', color: '#1565c0', label: 'Enquiries' },
  quotations:  { bg: '#fff3e0', color: '#e65100', label: 'Quotations' },
  oa:          { bg: '#f3e5f5', color: '#6a1b9a', label: 'Orders & OA' },
}

const ACTION_META = {
  view:   { icon: ic.eye,    bg: '#f0fdf4', color: '#16a34a', label: 'View'   },
  add:    { icon: ic.plus,   bg: '#eff6ff', color: '#2563eb', label: 'Add'    },
  change: { icon: ic.tag,    bg: '#fefce8', color: '#ca8a04', label: 'Change' },
  delete: { icon: ic.trash,  bg: '#fff1f2', color: '#e11d48', label: 'Delete' },
}

function AppBadge({ app }) {
  const m = APP_COLORS[app] || { bg: '#f1f5f9', color: '#64748b', label: app }
  return (
    <span style={{
      display: 'inline-block', padding: '2px 9px', borderRadius: 99,
      background: m.bg, color: m.color, fontSize: 11, fontWeight: 700,
      letterSpacing: '.03em', textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>{m.label}</span>
  )
}

function ActionBadge({ action }) {
  const key = Object.keys(ACTION_META).find(k => action?.startsWith(k)) || 'view'
  const m = ACTION_META[key]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 99,
      background: m.bg, color: m.color, fontSize: 11, fontWeight: 700,
    }}>
      <Icon d={m.icon} size={10} color={m.color} />
      {m.label}
    </span>
  )
}

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 2800); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      background: type === 'success' ? '#052e16' : '#450a0a',
      color: type === 'success' ? '#86efac' : '#fca5a5',
      padding: '12px 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 600,
      boxShadow: '0 8px 32px rgba(0,0,0,.28)', fontFamily: FONT,
      display: 'flex', alignItems: 'center', gap: 10,
      animation: 'slideUp .25s ease',
    }}>
      <Icon d={type === 'success' ? ic.check : ic.x} size={15}
        color={type === 'success' ? '#86efac' : '#fca5a5'} />
      {message}
    </div>
  )
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function PermissionsManager() {
  const [employees, setEmployees]       = useState([])
  const [allPerms, setAllPerms]         = useState([])
  const [selectedEmp, setSelectedEmp]   = useState(null)
  const [empPerms, setEmpPerms]         = useState([])
  const [loadingEmps, setLoadingEmps]   = useState(true)
  const [loadingPerms, setLoadingPerms] = useState(false)
  const [toast, setToast]               = useState(null)
  const [empSearch, setEmpSearch]       = useState('')
  const [permSearch, setPermSearch]     = useState('')
  const [filterApp, setFilterApp]       = useState('all')
  const [toggling, setToggling]         = useState(null)

  /* fetch employees + all available permissions */
  useEffect(() => {
    api.get('/accounts/tenant/employees/').then(r => setEmployees(r.data || [])).catch(console.error).finally(() => setLoadingEmps(false))
    api.get('/accounts/permissions/').then(r => setAllPerms(r.data || [])).catch(console.error)
  }, [])

  /* fetch permissions for selected employee */
  const loadEmpPerms = useCallback((empId) => {
    if (!empId) return
    setLoadingPerms(true)
    api.get(`/user-permissions/${empId}/`)
      .then(r => setEmpPerms(r.data || []))
      .catch(console.error)
      .finally(() => setLoadingPerms(false))
  }, [])

  const selectEmployee = (emp) => {
    setSelectedEmp(emp)
    setEmpPerms([])
    loadEmpPerms(emp.id)
    setPermSearch('')
    setFilterApp('all')
  }

  const hasPermission = (permId) => empPerms.some(p => p.id === permId)

  const togglePermission = async (perm) => {
    if (toggling) return
    setToggling(perm.id)
    const has = hasPermission(perm.id)
    try {
      if (has) {
        await api.post('/accounts/remove-permission/', { user_id: selectedEmp.id, permission_id: perm.id })
        setEmpPerms(prev => prev.filter(p => p.id !== perm.id))
        showToast(`Removed "${perm.name}"`, 'error')
      } else {
        await api.post('/accounts/assign-permission/', { user_id: selectedEmp.id, permission_id: perm.id })
        setEmpPerms(prev => [...prev, perm])
        showToast(`Granted "${perm.name}"`, 'success')
      }
    } catch (e) {
      showToast('Something went wrong', 'error')
    } finally {
      setToggling(null)
    }
  }

  const grantAll = async (filteredPerms) => {
    for (const perm of filteredPerms) {
      if (!hasPermission(perm.id)) {
        try {
          await api.post('/assign-permission/', { user_id: selectedEmp.id, permission_id: perm.id })
          setEmpPerms(prev => [...prev, perm])
        } catch {}
      }
    }
    showToast('All permissions granted', 'success')
  }

  const revokeAll = async (filteredPerms) => {
    for (const perm of filteredPerms) {
      if (hasPermission(perm.id)) {
        try {
          await api.post('/accounts/remove-permission/', { user_id: selectedEmp.id, permission_id: perm.id })
          setEmpPerms(prev => prev.filter(p => p.id !== perm.id))
        } catch {}
      }
    }
    showToast('All permissions revoked', 'error')
  }

  const showToast = (message, type) => setToast({ message, type })

  /* derived lists */
  const filteredEmployees = employees.filter(e =>
    (e.username + (e.first_name || '') + (e.last_name || '')).toLowerCase().includes(empSearch.toLowerCase())
  )

  const filteredPerms = allPerms.filter(p => {
    const matchApp = filterApp === 'all' || p.content_type__app_label === filterApp
    const matchSearch = p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
                        p.codename.toLowerCase().includes(permSearch.toLowerCase())
    return matchApp && matchSearch
  })

  const grantedCount = empPerms.length
  const totalCount   = allPerms.length
  const pct = totalCount ? Math.round((grantedCount / totalCount) * 100) : 0

  /* group perms by app */
  const grouped = filteredPerms.reduce((acc, p) => {
    const app = p.content_type__app_label
    if (!acc[app]) acc[app] = []
    acc[app].push(p)
    return acc
  }, {})

  const apps = Object.keys(APP_COLORS)

  return (
    <div style={{ fontFamily: FONT, color: '#1a1a2e', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        .emp-row:hover     { background: #f0f6ff !important; }
        .emp-row           { transition: background .13s; cursor: pointer; }
        .perm-row:hover    { background: #f8fafc !important; }
        .perm-row          { transition: background .13s; }
        .toggle-btn        { transition: all .18s; cursor: pointer; }
        .toggle-btn:hover  { transform: scale(1.06); }
        .tab-btn:hover     { background: rgba(30,136,229,.08) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
      `}</style>

      {/* ── BANNER ── */}
      <div style={{
        backgroundImage: `linear-gradient(125deg,rgba(13,31,48,.75) 0%,rgba(18,44,65,.65) 45%,rgba(26,74,110,.45) 100%),url(${banner})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        borderRadius: 16, padding: '28px 32px 32px', marginBottom: 28,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', right:-60, top:-60, width:280, height:280, borderRadius:'50%', background:'rgba(255,255,255,.03)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', right:110, top:20, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,.04)', pointerEvents:'none' }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', position:'relative', zIndex:1 }}>
          <div>
            <p style={{ margin:'0 0 4px', color:'rgba(255,255,255,.5)', fontSize:11.5, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' }}>Manager Console</p>
            <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:'#fff', letterSpacing:'-0.02em', display:'flex', alignItems:'center', gap:12 }}>
              <Icon d={ic.shield} size={26} color='#fff' fill='rgba(255,255,255,.15)' />
              Permission Manager
            </h1>
            <p style={{ margin:'6px 0 0', color:'rgba(255,255,255,.5)', fontSize:13 }}>
              Assign or revoke CRM module access for your team members
            </p>
          </div>

          {selectedEmp && (
            <div style={{
              background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,.2)', borderRadius: 14,
              padding: '14px 22px', textAlign: 'right',
            }}>
              <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>Selected Employee</div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 17, marginTop: 3 }}>{selectedEmp.username}</div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                <div style={{ height: 6, width: 110, borderRadius: 99, background: 'rgba(255,255,255,.2)' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: pct > 70 ? '#4ade80' : pct > 30 ? '#facc15' : '#f87171', width: `${pct}%`, transition: 'width .4s' }} />
                </div>
                <span style={{ color: 'rgba(255,255,255,.75)', fontSize: 12, fontWeight: 600 }}>{grantedCount}/{totalCount}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>

        {/* ── LEFT: EMPLOYEE LIST ── */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 220px)' }}>
          <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: PRIMARY }}>Team Members</h3>
            <div style={{ position: 'relative' }}>
              <Icon d={ic.search} size={13} color='#94a3b8' style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }} />
              <input
                value={empSearch}
                onChange={e => setEmpSearch(e.target.value)}
                placeholder="Search employees…"
                style={{
                  width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8,
                  border: '1.5px solid #e5e7eb', fontSize: 12.5, fontFamily: FONT,
                  outline: 'none', color: '#374151', background: '#f9fafb',
                }}
              />
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loadingEmps ? (
              [...Array(5)].map((_, i) => (
                <div key={i} style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 12, background: '#f1f5f9', borderRadius: 6, marginBottom: 6, width: '70%' }} />
                    <div style={{ height: 10, background: '#f1f5f9', borderRadius: 6, width: '40%' }} />
                  </div>
                </div>
              ))
            ) : filteredEmployees.length === 0 ? (
              <div style={{ padding: 28, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No employees found</div>
            ) : filteredEmployees.map(emp => {
              const isActive = selectedEmp?.id === emp.id
              return (
                <div
                  key={emp.id}
                  className="emp-row"
                  onClick={() => selectEmployee(emp)}
                  style={{
                    padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 11,
                    background: isActive ? '#eff6ff' : 'transparent',
                    borderLeft: isActive ? `3px solid ${ACCENT}` : '3px solid transparent',
                    borderBottom: '1px solid #f8fafc',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: isActive ? ACCENT : PRIMARY,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: 14,
                  }}>
                    {emp.username[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: isActive ? ACCENT : PRIMARY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {emp.first_name && emp.last_name ? `${emp.first_name} ${emp.last_name}` : emp.username}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1 }}>@{emp.username}</div>
                  </div>
                  {isActive && <Icon d={ic.chevronR} size={14} color={ACCENT} />}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT: PERMISSIONS PANEL ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {!selectedEmp ? (
            <div style={{
              background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,.07)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '72px 40px', gap: 16,
            }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: '#f0f6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon d={ic.user} size={30} color={ACCENT} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 17, color: PRIMARY }}>Select an Employee</div>
              <div style={{ color: '#94a3b8', fontSize: 13.5, textAlign: 'center', maxWidth: 340 }}>
                Choose a team member from the left panel to view and manage their module permissions.
              </div>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,.07)', overflow: 'hidden', animation: 'fadeUp .3s ease' }}>
              
              {/* Header */}
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbfc' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>
                      {selectedEmp.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: PRIMARY }}>
                        {selectedEmp.first_name && selectedEmp.last_name ? `${selectedEmp.first_name} ${selectedEmp.last_name}` : selectedEmp.username}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: 12 }}>@{selectedEmp.username} · Employee</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ textAlign: 'right', marginRight: 4 }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>PERMISSIONS</div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: PRIMARY }}>{grantedCount} <span style={{ fontWeight: 400, fontSize: 13, color: '#94a3b8' }}>/ {totalCount}</span></div>
                  </div>
                  <button
                    onClick={() => grantAll(filteredPerms)}
                    style={{ ...actionBtn, background: '#052e16', color: '#86efac', border: '1px solid #166534' }}
                  >
                    <Icon d={ic.check} size={13} color='#86efac' /> Grant All
                  </button>
                  <button
                    onClick={() => revokeAll(filteredPerms)}
                    style={{ ...actionBtn, background: '#450a0a', color: '#fca5a5', border: '1px solid #991b1b' }}
                  >
                    <Icon d={ic.x} size={13} color='#fca5a5' /> Revoke All
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                  <Icon d={ic.search} size={13} color='#94a3b8' />
                  <input
                    value={permSearch}
                    onChange={e => setPermSearch(e.target.value)}
                    placeholder="Search permissions…"
                    style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12.5, fontFamily: FONT, outline: 'none', color: '#374151', background: '#f9fafb', position: 'relative' }}
                  />
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <Icon d={ic.search} size={13} color='#94a3b8' />
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['all', ...apps].map(app => (
                    <button
                      key={app}
                      className="tab-btn"
                      onClick={() => setFilterApp(app)}
                      style={{
                        padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        border: filterApp === app ? `1.5px solid ${ACCENT}` : '1.5px solid #e5e7eb',
                        background: filterApp === app ? `${ACCENT}15` : '#fff',
                        color: filterApp === app ? ACCENT : '#64748b',
                        fontFamily: FONT, transition: 'all .15s',
                      }}
                    >
                      {app === 'all' ? 'All' : APP_COLORS[app]?.label || app}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permission Rows */}
              <div style={{ maxHeight: 'calc(100vh - 380px)', overflowY: 'auto' }}>
                {loadingPerms ? (
                  <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#94a3b8', fontSize: 13.5 }}>
                    <div style={{ width: 18, height: 18, border: `2px solid #e2e8f0`, borderTopColor: PRIMARY, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                    Loading permissions…
                  </div>
                ) : Object.keys(grouped).length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13.5 }}>No permissions match your filter</div>
                ) : Object.entries(grouped).map(([app, perms]) => (
                  <div key={app}>
                    {/* App group header */}
                    <div style={{ padding: '10px 24px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <AppBadge app={app} />
                      <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                        {perms.filter(p => hasPermission(p.id)).length}/{perms.length} granted
                      </span>
                      <div style={{ flex: 1 }} />
                      <button
                        onClick={() => grantAll(perms)}
                        style={{ ...miniBtn, color: '#16a34a', borderColor: '#16a34a' }}
                      >+ Grant all</button>
                      <button
                        onClick={() => revokeAll(perms)}
                        style={{ ...miniBtn, color: '#dc2626', borderColor: '#dc2626' }}
                      >− Revoke all</button>
                    </div>

                    {/* Perm items */}
                    {perms.map((perm, i) => {
                      const granted = hasPermission(perm.id)
                      const isToggling = toggling === perm.id
                      const action = Object.keys(ACTION_META).find(k => perm.codename.startsWith(k)) || 'view'
                      return (
                        <div
                          key={perm.id}
                          className="perm-row"
                          style={{
                            padding: '13px 24px', display: 'flex', alignItems: 'center', gap: 14,
                            background: granted ? 'rgba(22,163,74,.03)' : i % 2 === 0 ? '#fafafa' : '#fff',
                            borderBottom: '1px solid #f1f5f9',
                            borderLeft: granted ? '3px solid #16a34a' : '3px solid transparent',
                          }}
                        >
                          <ActionBadge action={perm.codename} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13.5, color: '#1e293b' }}>{perm.name}</div>
                            <div style={{ fontSize: 11.5, color: '#94a3b8', fontFamily: 'monospace', marginTop: 2 }}>{perm.codename}</div>
                          </div>

                          {/* Toggle switch */}
                          <button
                            className="toggle-btn"
                            onClick={() => togglePermission(perm)}
                            disabled={isToggling}
                            style={{
                              width: 48, height: 26, borderRadius: 99,
                              background: granted ? '#16a34a' : '#e2e8f0',
                              border: 'none', padding: '3px', cursor: isToggling ? 'wait' : 'pointer',
                              position: 'relative', transition: 'background .2s',
                              opacity: isToggling ? .6 : 1,
                            }}
                          >
                            <div style={{
                              width: 20, height: 20, borderRadius: '50%', background: '#fff',
                              boxShadow: '0 1px 4px rgba(0,0,0,.22)',
                              position: 'absolute', top: 3,
                              left: granted ? 'calc(100% - 23px)' : 3,
                              transition: 'left .2s',
                            }} />
                          </button>

                          {/* Grant / Revoke label */}
                          <span style={{ width: 52, fontSize: 11.5, fontWeight: 700, textAlign: 'right', color: granted ? '#16a34a' : '#94a3b8' }}>
                            {granted ? 'Granted' : 'None'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── TOAST ── */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

/* ── shared styles ── */
const actionBtn = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700,
  cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap',
}
const miniBtn = {
  padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
  cursor: 'pointer', fontFamily: FONT, background: 'transparent',
  border: '1.5px solid',
}