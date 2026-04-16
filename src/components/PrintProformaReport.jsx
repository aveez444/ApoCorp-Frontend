// src/components/PrintProformaReport.jsx

const fmt = n => new Intl.NumberFormat("en-IN").format(n ?? 0)

const PROFORMA_STATUS_LABELS = {
  DRAFT: "Draft",
  SENT: "Sent",
  PARTIAL: "Partial Payment",
  PAID: "Paid",
  CANCELLED: "Cancelled",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  HOLD: "On Hold"
}

export const printProformaReport = (proformas, view, counts) => {
  // Get current date for the report
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN')
  const timeStr = now.toLocaleTimeString('en-IN')
  
  // Get view title
  const viewTitle = {
    pending: 'Pending Invoice (Orders without Proforma)',
    draft: 'Draft Invoice',
    sent: 'Payment Received / Sent'
  }[view] || 'Proforma Invoices'
  
  // Calculate summary statistics
  const summaryStats = {
    total: proformas.length,
    totalValue: proformas.reduce((sum, p) => sum + (Number(p.total_amount) || Number(p.total_value) || 0), 0),
    ...counts
  }
  
  // Create the print HTML content
  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Proforma Invoices Report - ${dateStr}</title>
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
          
          .report-header .invoice-type {
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
          
          .stat-value.warning {
            color: #f59e0b;
          }
          
          .stat-value.info {
            color: #1e88e5;
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
          
          .status-DRAFT { background: #fffbeb; color: #f59e0b; }
          .status-SENT { background: #e2f1ff; color: #1e88e5; }
          .status-PARTIAL { background: #f3e8ff; color: #7c3aed; }
          .status-PAID { background: #f0fdf4; color: #16a34a; }
          .status-CANCELLED { background: #f9fafb; color: #6b7280; }
          .status-IN_PROGRESS { background: #e2f1ff; color: #1e88e5; }
          .status-COMPLETED { background: #f0fdf4; color: #16a34a; }
          .status-HOLD { background: #fffbeb; color: #f59e0b; }
          .status-PENDING { background: #f0fdf4; color: #16a34a; }
          
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
            <h1>Proforma Invoices Report</h1>
            <div class="subtitle">Invoice Management System</div>
            <div class="invoice-type">${viewTitle}</div>
            <div class="report-meta">
              <span>Generated: ${dateStr} at ${timeStr}</span>
              <span>Total Invoices: ${summaryStats.total}</span>
              <span>Total Value: ${fmt(summaryStats.totalValue)}</span>
            </div>
          </div>
          
          <!-- Summary Stats -->
          <div class="summary-stats">
            <div class="stat-item">
              <div class="stat-label">Pending Orders</div>
              <div class="stat-value ${(counts.pending || 0) > 0 ? 'highlight' : ''}">${counts.pending || 0}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Draft Invoices</div>
              <div class="stat-value warning">${counts.draft || 0}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Sent / Paid</div>
              <div class="stat-value info">${counts.sent || 0}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Total Proformas</div>
              <div class="stat-value">${(counts.draft || 0) + (counts.sent || 0)}</div>
            </div>
          </div>
          
          <!-- Data Table -->
          <table class="data-table">
            <thead>
              <tr>
                ${view === 'pending' ? `
                  <th>Order Number</th>
                  <th>OA Number</th>
                  <th>Order Date</th>
                  <th>Customer Name</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Amount</th>
                  <th>Order Status</th>
                ` : `
                  <th>Proforma Number</th>
                  <th>Order Number</th>
                  <th>Invoice Date</th>
                  <th>Customer Name</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Amount</th>
                  <th>Invoice Status</th>
                `}
              </tr>
            </thead>
            <tbody>
              ${proformas.map(item => {
                const customer = item.customer_detail || {}
                const contact = customer.telephone_primary || customer.email || '-'
                const location = [customer.city, customer.country].filter(Boolean).join(', ') || '-'
                
                if (view === 'pending') {
                  const statusLabel = item.status === 'COMPLETED' ? 'Completed' : 
                                    item.status === 'IN_PROGRESS' ? 'In Progress' : 
                                    item.status === 'HOLD' ? 'On Hold' : item.status || 'Pending'
                  
                  return `
                    <tr>
                      <td style="font-weight: 600; font-family: monospace;">${item.order_number || '-'}</td>
                      <td style="font-family: monospace; color: #6b7280;">${item.oa_number || '-'}</td>
                      <td>${item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : '-'}</td>
                      <td style="font-weight: 500;">${customer.company_name || '-'}</td>
                      <td>${contact}</td>
                      <td>${location}</td>
                      <td style="font-weight: 500;">${fmt(item.total_value)}</td>
                      <td>
                        <span class="print-status-badge status-${item.status}">
                          ${statusLabel}
                        </span>
                      </td>
                    </tr>
                  `
                } else {
                  const statusLabel = PROFORMA_STATUS_LABELS[item.status] || item.status || 'Draft'
                  
                  return `
                    <tr>
                      <td style="font-weight: 600; font-family: monospace;">${item.proforma_number || '-'}</td>
                      <td style="font-family: monospace; color: #6b7280;">${item.order_number || '-'}</td>
                      <td>${item.invoice_date || item.created_at?.slice(0,10) || '-'}</td>
                      <td style="font-weight: 500;">${customer.company_name || '-'}</td>
                      <td>${contact}</td>
                      <td>${location}</td>
                      <td style="font-weight: 500;">${fmt(item.total_amount || item.total_value)}</td>
                      <td>
                        <span class="print-status-badge status-${item.status}">
                          ${statusLabel}
                        </span>
                      </td>
                    </tr>
                  `
                }
              }).join('')}
              ${proformas.length === 0 ? `
                <tr>
                  <td colspan="8" style="text-align: center; padding: 40px;">
                    No proforma invoices found
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
          
          <!-- Footer -->
          <div class="report-footer">
            <p>This is a system-generated report. For any queries, please contact the administrator.</p>
            <p>Generated from Invoice Management System</p>
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

// Hook for easier usage
export const usePrintProformaReport = () => {
  const printReport = (proformas, view, counts) => {
    printProformaReport(proformas, view, counts)
  }
  
  return { printReport }
}