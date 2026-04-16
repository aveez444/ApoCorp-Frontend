// src/components/PrintQuotationReport.jsx
import React from 'react'

const REVIEW_STATUS_LABELS = {
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected"
}

const CLIENT_STATUS_LABELS = {
  DRAFT: "Draft",
  SENT: "Quoted",
  UNDER_NEGOTIATION: "Under Negotiation",
  ACCEPTED: "Accepted",
  REJECTED_BY_CLIENT: "Rejected by Client"
}

const fmt = n => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—'

export const printQuotationReport = (quotations, stats, isExternal = false) => {
  // Get current date for the report
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN')
  const timeStr = now.toLocaleTimeString('en-IN')
  
  // Get status labels based on type
  const statusLabels = isExternal ? CLIENT_STATUS_LABELS : REVIEW_STATUS_LABELS
  
  // Calculate summary statistics
  const summaryStats = {
    total: quotations.length,
    totalValue: quotations.reduce((sum, q) => sum + (Number(q.grand_total) || 0), 0),
    ...stats
  }
  
  // Create the print HTML content
  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Quotations Report - ${dateStr}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
            padding: 40px;
            background: white;
            color: #1e293b;
          }
          
          .print-report {
            max-width: 1400px;
            margin: 0 auto;
          }
          
          /* Header Styles */
          .report-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #122C41;
          }
          
          .report-header h1 {
            color: #122C41;
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: 700;
          }
          
          .report-header .subtitle {
            color: #64748b;
            font-size: 14px;
            margin-top: 5px;
          }
          
          .report-header .quotation-type {
            display: inline-block;
            background: #122C41;
            color: white;
            padding: 4px 16px;
            border-radius: 20px;
            font-size: 12px;
            margin-top: 10px;
          }
          
          .report-meta {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
          }
          
          /* Summary Stats */
          .summary-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 12px;
          }
          
          .stat-item {
            text-align: center;
          }
          
          .stat-label {
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
            margin-bottom: 6px;
          }
          
          .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: #122C41;
          }
          
          .stat-value.negative {
            color: #dc2626;
          }
          
          /* Table Styles */
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
          }
          
          .data-table th {
            background: #122C41;
            color: white;
            padding: 12px 10px;
            text-align: left;
            font-weight: 600;
            font-size: 11px;
            letter-spacing: 0.5px;
            border: 1px solid #1a3f5c;
          }
          
          .data-table td {
            border: 1px solid #e2e8f0;
            padding: 10px;
            vertical-align: top;
          }
          
          .data-table tbody tr:hover {
            background: #f8fafc;
          }
          
          /* Status Badge in Print */
          .print-status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 15px;
            font-size: 10px;
            font-weight: 600;
          }
          
          .status-UNDER_REVIEW { background: #fffbe6; color: #c8860a; }
          .status-APPROVED { background: #e6faf0; color: #0a8c5a; }
          .status-REJECTED { background: #fff0f0; color: #d12b2b; }
          .status-DRAFT { background: #f1f5f9; color: #475569; }
          .status-SENT { background: #e8f4ff; color: #1a7fd4; }
          .status-UNDER_NEGOTIATION { background: #fdf0ff; color: #9b30c8; }
          .status-ACCEPTED { background: #e6faf0; color: #0a8c5a; }
          .status-REJECTED_BY_CLIENT { background: #fff0f0; color: #d12b2b; }
          
          /* Footer */
          .report-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
          }
          
          @media print {
            body {
              padding: 20px;
            }
            .data-table tr {
              page-break-inside: avoid;
            }
            .summary-stats {
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-report">
          <!-- Header -->
          <div class="report-header">
            <h1>Quotations Report</h1>
            <div class="subtitle">Quotation Management System</div>
            <div class="quotation-type">${isExternal ? 'External Quotations' : 'Internal Quotations'}</div>
            <div class="report-meta">
              <span>Generated: ${dateStr} at ${timeStr}</span>
              <span>Total Quotations: ${summaryStats.total}</span>
              <span>Total Value: ${fmt(summaryStats.totalValue)}</span>
            </div>
          </div>
          
          <!-- Summary Stats -->
          <div class="summary-stats">
            <div class="stat-item">
              <div class="stat-label">Under Review</div>
              <div class="stat-value">${stats.under_review || 0}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Approved</div>
              <div class="stat-value">${stats.approved || 0}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Rejected</div>
              <div class="stat-value ${(stats.rejected || 0) > 0 ? 'negative' : ''}">${stats.rejected || 0}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Accepted</div>
              <div class="stat-value">${stats.accepted || 0}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Under Negotiation</div>
              <div class="stat-value">${stats.negotiation || 0}</div>
            </div>
          </div>
          
          <!-- Data Table -->
          <table class="data-table">
            <thead>
              <tr>
                <th>Quotation No.</th>
                <th>Date</th>
                <th>Entity Name</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Amount</th>
                ${!isExternal ? '<th>Remark</th>' : ''}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${quotations.map(quotation => {
                const customer = quotation.customer_detail || {}
                const poc = (customer.pocs || []).find(p => p.is_primary) || (customer.pocs || [])[0] || {}
                const phone = poc.phone || customer.telephone_primary || '-'
                const email = poc.email || customer.email || ''
                const location = [customer.city, customer.state, customer.country].filter(Boolean).join(', ') || '-'
                const contactInfo = phone !== '-' ? (email ? `${phone} / ${email}` : phone) : (email || '-')
                
                return `
                  <tr>
                    <td style="font-weight: 600;">${quotation.quotation_number || '-'}</td>
                    <td>${quotation.created_at?.slice(0, 10) || '-'}</td>
                    <td style="font-weight: 500;">${customer.company_name || '-'}</td>
                    <td>${contactInfo}</td>
                    <td>${location}</td>
                    <td style="font-weight: 500;">${fmt(quotation.grand_total)}</td>
                    ${!isExternal ? `<td style="color: #64748b;">${quotation.manager_remark || 'NIL'}</td>` : ''}
                    <td>
                      <span class="print-status-badge status-${isExternal ? quotation.client_status : quotation.review_status}">
                        ${statusLabels[isExternal ? quotation.client_status : quotation.review_status] || (isExternal ? quotation.client_status : quotation.review_status)}
                      </span>
                    </td>
                  </tr>
                `
              }).join('')}
              ${quotations.length === 0 ? `
                <tr>
                  <td colspan="${isExternal ? 7 : 8}" style="text-align: center; padding: 40px;">
                    No quotations found
                  </td>
                </tr>
              ` : ''}
            </tbody>
           </table>
          
          <!-- Footer -->
          <div class="report-footer">
            <p>This is a system-generated report. For any queries, please contact the administrator.</p>
            <p>Generated from Quotation Management System</p>
          </div>
        </div>
      </body>
    </html>
  `
  
  // Open print window
  const printWindow = window.open('', '_blank')
  printWindow.document.write(printContent)
  printWindow.document.close()
  printWindow.focus()
  
  printWindow.onload = () => {
    printWindow.print()
  }
}

// Optional: Create a hook for easier usage
export const usePrintQuotationReport = () => {
  const printReport = (quotations, stats, isExternal = false) => {
    printQuotationReport(quotations, stats, isExternal)
  }
  
  return { printReport }
}