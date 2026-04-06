// src/components/PrintEnquiryReport.jsx
import React from 'react'

const STATUS_LABELS = {
  NEW: "New Enquiry",
  PENDING: "Pending Enquiry",
  NEGOTIATION: "Under Negotiation",
  QUOTED: "Quoted Enquiry",
  PO_RECEIVED: "PO Received",
  LOST: "Enquiry Lost",
  REGRET: "Regret"
}

const fmt = n => new Intl.NumberFormat("en-IN").format(n ?? 0)

export const printEnquiryReport = (filteredEnquiries, stats) => {
  // Get current date for the report
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN')
  const timeStr = now.toLocaleTimeString('en-IN')
  
  // Create the print HTML content
  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Enquiries Report - ${dateStr}</title>
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
          
          .report-meta {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
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
          
          .status-NEW { background: #e8f4ff; color: #1a7fd4; }
          .status-PENDING { background: #fffbe6; color: #c8860a; }
          .status-NEGOTIATION { background: #fdf0ff; color: #9b30c8; }
          .status-QUOTED { background: #e6fff5; color: #0a9e6e; }
          .status-PO_RECEIVED { background: #e6faf0; color: #0a8c5a; }
          .status-LOST { background: #fff0f0; color: #d12b2b; }
          .status-REGRET { background: #f5f0ff; color: #7e22ce; }
          
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
          }
        </style>
      </head>
      <body>
        <div class="print-report">
          <!-- Header -->
          <div class="report-header">
            <h1>Enquiries Report</h1>
            <div class="subtitle">Enquiry Management System</div>
            <div class="report-meta">
              <span>Generated: ${dateStr} at ${timeStr}</span>
              <span>Total Enquiries: ${filteredEnquiries.length}</span>
            </div>
          </div>
          
          <!-- Data Table -->
          <table class="data-table">
            <thead>
              <tr>
                <th>Enquiry No.</th>
                <th>Date</th>
                <th>Target Date</th>
                <th>Entity Name</th>
                <th>Prospective Value</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEnquiries.map(enquiry => `
                <tr>
                  <td style="font-weight: 600;">${enquiry.enquiry_number || '-'}</td>
                  <td>${enquiry.enquiry_date || '-'}</td>
                  <td>${enquiry.target_submission_date || '-'}</td>
                  <td>${enquiry.customer_detail?.company_name || '-'}</td>
                  <td style="font-weight: 500;">₹${fmt(enquiry.prospective_value)}</td>
                  <td>${enquiry.customer_detail?.telephone_primary || '-'}</td>
                  <td>${enquiry.enquiry_type || '-'}</td>
                  <td>${[enquiry.customer_detail?.city, enquiry.customer_detail?.country].filter(Boolean).join(', ') || '-'}</td>
                  <td>
                    <span class="print-status-badge status-${enquiry.status}">
                      ${STATUS_LABELS[enquiry.status] || enquiry.status}
                    </span>
                  </td>
                </tr>
              `).join('')}
              ${filteredEnquiries.length === 0 ? `
                <tr>
                  <td colspan="9" style="text-align: center; padding: 40px;">
                    No enquiries found
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
export const usePrintReport = () => {
  const printReport = (filteredEnquiries, stats) => {
    printEnquiryReport(filteredEnquiries, stats)
  }
  
  return { printReport }
}
