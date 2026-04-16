// src/components/PrintOAReport.jsx
import React from 'react'

const OA_STATUS_LABELS = {
  PENDING: "Ready for OA",
  DRAFT: "Draft OA",
  CONVERTED: "Sent / Converted",
  CANCELLED: "Cancelled"
}

const fmt = n => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—'

export const printOAReport = (oas, view, counts) => {
  // Get current date for the report
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN')
  const timeStr = now.toLocaleTimeString('en-IN')
  
  // Get view title
  const viewTitle = {
    pending: 'Ready for OA',
    draft: 'Draft OA',
    sent: 'Sent OA'
  }[view] || 'Order Acknowledgements'
  
  // Calculate summary statistics
  const summaryStats = {
    total: oas.length,
    totalValue: oas.reduce((sum, oa) => sum + (Number(oa.total_value) || 0), 0),
    ...counts
  }
  
  // Create the print HTML content
  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Order Acknowledgements Report - ${dateStr}</title>
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
          
          .report-header .oa-type {
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
            grid-template-columns: repeat(4, 1fr);
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
          
          .stat-value.highlight {
            color: #16a34a;
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
          
          .status-PENDING { background: #f0fdf4; color: #16a34a; }
          .status-DRAFT { background: #fffbeb; color: #f59e0b; }
          .status-CONVERTED { background: #e2f1ff; color: #1e88e5; }
          .status-CANCELLED { background: #f9fafb; color: #6b7280; }
          
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
            <h1>Order Acknowledgements Report</h1>
            <div class="subtitle">Order Acknowledgement Management System</div>
            <div class="oa-type">${viewTitle}</div>
            <div class="report-meta">
              <span>Generated: ${dateStr} at ${timeStr}</span>
              <span>Total OAs: ${summaryStats.total}</span>
              <span>Total Value: ${fmt(summaryStats.totalValue)}</span>
            </div>
          </div>
          
          <!-- Summary Stats -->
          <div class="summary-stats">
            <div class="stat-item">
              <div class="stat-label">Ready for OA</div>
              <div class="stat-value ${(counts.pending || 0) > 0 ? 'highlight' : ''}">${counts.pending || 0}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Draft OA</div>
              <div class="stat-value">${counts.draft || 0}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Sent OA</div>
              <div class="stat-value">${counts.sent || 0}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Total OAs</div>
              <div class="stat-value">${(counts.pending || 0) + (counts.draft || 0) + (counts.sent || 0)}</div>
            </div>
          </div>
          
          <!-- Data Table -->
          <table class="data-table">
            <thead>
              <tr>
                <th>OA Number</th>
                <th>Quotation Number</th>
                <th>Date</th>
                <th>Customer Name</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${oas.map(oa => {
                const customer = oa.customer_detail || {}
                const contact = customer.telephone_primary || customer.email || '-'
                const location = [customer.city, customer.country].filter(Boolean).join(', ') || '-'
                const statusLabel = OA_STATUS_LABELS[oa.status] || oa.status
                
                return `
                  <tr>
                    <td style="font-weight: 600; font-family: monospace;">${oa.oa_number || '-'}</td>
                    <td style="font-family: monospace; color: #6b7280;">${oa.quotation_number || '-'}</td>
                    <td>${oa.created_at ? new Date(oa.created_at).toLocaleDateString('en-IN') : '-'}</td>
                    <td style="font-weight: 500;">${customer.company_name || '-'}</td>
                    <td>${contact}</td>
                    <td>${location}</td>
                    <td style="font-weight: 500;">${fmt(oa.total_value)}</td>
                    <td>
                      <span class="print-status-badge status-${oa.status}">
                        ${statusLabel}
                      </span>
                    </td>
                  </tr>
                `
              }).join('')}
              ${oas.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align: center; padding: 40px;">
                    No order acknowledgements found
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
          
          <!-- Footer -->
          <div class="report-footer">
            <p>This is a system-generated report. For any queries, please contact the administrator.</p>
            <p>Generated from Order Acknowledgement Management System</p>
          </div>
        </div>
      </body>
    </html>
  `
  
  // Open print window
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}

// Optional: Create a hook for easier usage
export const usePrintOAReport = () => {
  const printReport = (oas, view, counts) => {
    printOAReport(oas, view, counts)
  }
  
  return { printReport }
}