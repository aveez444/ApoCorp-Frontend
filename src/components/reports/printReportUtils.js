import { fmt, MODULE_META } from './reportConstants'

export const generatePrintHTML = (results, config, reportName = 'Custom Report') => {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN')
  const timeStr = now.toLocaleTimeString('en-IN')

  const getModuleLabel = (modKey) => {
    return MODULE_META[modKey]?.label || modKey
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${reportName} - ${dateStr}</title>
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
            line-height: 1.5;
          }
          
          .print-report {
            max-width: 1400px;
            margin: 0 auto;
          }
          
          /* Header Styles */
          .report-header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 4px solid #122C41;
          }
          
          .report-header h1 {
            color: #122C41;
            font-size: 32px;
            margin-bottom: 8px;
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          
          .report-header .subtitle {
            color: #64748b;
            font-size: 15px;
          }
          
          .report-meta {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            font-size: 13px;
            color: #64748b;
            font-weight: 500;
          }
          
          /* Modules Section */
          .modules-section {
            margin-bottom: 32px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
          }
          
          .modules-section h3 {
            font-size: 15px;
            color: #122C41;
            margin-bottom: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .module-tags {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }
          
          .module-tag {
            padding: 6px 16px;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 600;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          }
          
          /* Table Styles */
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 13px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          }
          
          .data-table th {
            background: #122C41;
            color: white;
            padding: 14px 16px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            letter-spacing: 0.5px;
            border-bottom: 3px solid #1a3f5c;
            position: sticky;
            top: 0;
            z-index: 10;
          }
          
          .data-table td {
            border-bottom: 1px solid #e2e8f0;
            padding: 14px 16px;
            vertical-align: middle;
          }
          
          .data-table tbody tr:hover {
            background: #f8fafc;
          }
          
          .data-table tbody tr:last-child td {
            border-bottom: none;
          }
          
          /* Footer */
          .report-footer {
            margin-top: 60px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
          }
          
          @media print {
            body {
              padding: 30px;
            }
            .data-table tr {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-report">
          <!-- Header -->
          <div class="report-header">
            <h1>${reportName}</h1>
            <div class="subtitle">Custom Report • Enquiry Management System</div>
            <div class="report-meta">
              <span>Generated: ${dateStr} at ${timeStr}</span>
              <span>Total Records: ${results?.total || 0}</span>
            </div>
          </div>
          
          <!-- Modules Section -->
          ${config?.modules ? `
            <div class="modules-section">
              <h3>📁 Modules Included</h3>
              <div class="module-tags">
                ${config.modules.map(mod => `
                  <span class="module-tag" style="background: ${MODULE_META[mod]?.bg || '#f1f5f9'}; color: ${MODULE_META[mod]?.color || '#64748b'}">
                    ${getModuleLabel(mod)}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <!-- Data Table -->
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                ${results?.columns.map(col => `<th>${col.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${results?.rows.map((row, idx) => `
                <tr>
                  <td style="font-weight: 600; color: #64748b;">${idx + 1}</td>
                  ${results.columns.map(col => {
                    const val = row[col.key]
                    let displayVal = val === null || val === undefined ? '—' : String(val)
                    if (typeof val === 'number') displayVal = `₹${val.toLocaleString('en-IN')}`
                    if (typeof val === 'boolean') displayVal = val ? 'Yes' : 'No'
                    return `<td>${displayVal}</td>`
                  }).join('')}
                </tr>
              `).join('')}
              ${results?.rows.length === 0 ? `
                <tr>
                  <td colspan="${(results?.columns?.length || 0) + 1}" style="text-align: center; padding: 60px; color: #94a3b8; font-size: 15px;">
                    No records found
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
          
          <!-- Footer -->
          <div class="report-footer">
            <p>This is a system-generated report. For any queries, please contact the administrator.</p>
            <p>Generated from Enquiry Management System</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export const printReport = (results, config, reportName) => {
  const printContent = generatePrintHTML(results, config, reportName)
  const printWindow = window.open('', '_blank')
  printWindow.document.write(printContent)
  printWindow.document.close()
  printWindow.focus()
  
  printWindow.onload = () => {
    printWindow.print()
  }
}

export const downloadPDF = (results, config, reportName) => {
  // Use browser's print to PDF functionality
  const printContent = generatePrintHTML(results, config, reportName)
  const printWindow = window.open('', '_blank')
  printWindow.document.write(printContent)
  printWindow.document.close()
  printWindow.focus()
  
  printWindow.onload = () => {
    printWindow.print()
  }
}