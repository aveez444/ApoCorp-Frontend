// ─── Manager wrappers ─────────────────────────────────────────────────────────
// Place these files in your manager pages folder
// Usage: import normally in your router

// ── ManagerVisitReportLanding.jsx ──────────────────────────────────────────────
import VisitReportLanding from '../employee/VisitReportLanding'

export default function ManagerVisitReportLanding() {
  return <VisitReportLanding basePath="/manager/reports/visit-reports" />
}