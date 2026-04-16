// src/components/PrintEnquiryDetail.jsx
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

export const printEnquiryDetail = (enquiry) => {
  if (!enquiry) return

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN')
  const timeStr = now.toLocaleTimeString('en-IN')

  const customer = enquiry.customer_detail || {}
  const primaryPoc = customer.pocs?.find(p => p.is_primary) || customer.pocs?.[0] || {}
  const billingAddr = customer.addresses?.find(a => a.address_type === 'BILLING') || {}

  const getRegionLabel = (regionCode) => {
    const regionMap = {
      'NORTH': 'North',
      'SOUTH': 'South',
      'EAST': 'East',
      'WEST': 'West',
      'CENTRAL': 'Central',
    }
    return regionMap[regionCode] || regionCode || '—'
  }

  const getStatusBadgeStyle = (status) => {
    const styles = {
      NEW: 'background: #e8f4ff; color: #1a7fd4; border-color: #a8d4f5;',
      PENDING: 'background: #fffbe6; color: #c8860a; border-color: #f5d98a;',
      NEGOTIATION: 'background: #fdf0ff; color: #9b30c8; border-color: #dfa8f5;',
      QUOTED: 'background: #e6fff5; color: #0a9e6e; border-color: #80e8c0;',
      PO_RECEIVED: 'background: #e6faf0; color: #0a8c5a; border-color: #6edcaa;',
      LOST: 'background: #fff0f0; color: #d12b2b; border-color: #f5a8a8;',
      REGRET: 'background: #f5f0ff; color: #7e22ce; border-color: #d4b0f5;'
    }
    return styles[status] || 'background: #f1f5f9; color: #475569; border-color: #e2e8f0;'
  }

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Enquiry ${enquiry.enquiry_number || 'Detail'} - ${dateStr}</title>
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
            max-width: 1200px;
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
          
          .enquiry-badge {
            display: inline-block;
            margin-top: 12px;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
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
          
          /* Section Styles */
          .section {
            margin-bottom: 24px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            page-break-inside: avoid;
          }
          
          .section-header {
            background: #f8fafc;
            padding: 14px 20px;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .section-header h2 {
            color: #122C41;
            font-size: 16px;
            font-weight: 700;
            margin: 0;
          }
          
          .section-content {
            padding: 20px;
          }
          
          /* Info Grid */
          .info-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px 24px;
          }
          
          .info-row {
            display: flex;
            margin-bottom: 12px;
            font-size: 13px;
          }
          
          .info-label {
            color: #64748b;
            font-weight: 500;
            min-width: 140px;
            flex-shrink: 0;
          }
          
          .info-value {
            color: #1e293b;
            font-weight: 600;
          }
          
          .full-width {
            grid-column: span 3;
          }
          
          /* Files Section */
          .files-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 12px;
          }
          
          .file-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background: #fafafa;
          }
          
          .file-icon {
            width: 40px;
            height: 40px;
            background: #eef3ff;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          
          .file-info {
            flex: 1;
          }
          
          .file-name {
            font-size: 13px;
            font-weight: 600;
            color: #1e293b;
            word-break: break-all;
          }
          
          .file-type {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 2px;
          }
          
          /* Rejection Reason */
          .rejection-box {
            margin-top: 16px;
            padding: 12px 16px;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
          }
          
          .rejection-label {
            font-size: 12px;
            font-weight: 600;
            color: #991b1b;
          }
          
          .rejection-text {
            font-size: 13px;
            color: #7f1d1d;
            margin-top: 4px;
          }
          
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
            .section {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-report">
          <!-- Header -->
          <div class="report-header">
            <h1>Enquiry Details</h1>
            <div class="subtitle">Enquiry Management System</div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 12px;">
              <span style="font-size: 20px; font-weight: 700; color: #122C41;">${enquiry.enquiry_number || '—'}</span>
              <span class="enquiry-badge" style="${getStatusBadgeStyle(enquiry.status)}">
                ${STATUS_LABELS[enquiry.status] || enquiry.status}
              </span>
            </div>
            <div class="report-meta">
              <span>Generated: ${dateStr} at ${timeStr}</span>
              <span>Reference ID: ${enquiry.id || '—'}</span>
            </div>
          </div>
          
          <!-- Customer Details -->
          <div class="section">
            <div class="section-header">
              <h2>Customer Details</h2>
            </div>
            <div class="section-content">
              <div class="info-grid">
                <div class="info-row">
                  <span class="info-label">Company Name:</span>
                  <span class="info-value">${customer.company_name || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">POC Name:</span>
                  <span class="info-value">${primaryPoc.name || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Designation:</span>
                  <span class="info-value">${primaryPoc.designation || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Phone (Landline):</span>
                  <span class="info-value">${customer.telephone_primary || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Phone (Mobile):</span>
                  <span class="info-value">${primaryPoc.phone || customer.telephone_primary || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email ID:</span>
                  <span class="info-value">${primaryPoc.email || customer.email || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">City:</span>
                  <span class="info-value">${billingAddr.city || customer.city || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">State:</span>
                  <span class="info-value">${billingAddr.state || customer.state || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Country:</span>
                  <span class="info-value">${customer.country || '—'}</span>
                </div>
              </div>
              ${(billingAddr.address_line || customer.address) ? `
                <div class="info-row" style="margin-top: 8px;">
                  <span class="info-label">Detailed Address:</span>
                  <span class="info-value">${billingAddr.address_line || customer.address || '—'}</span>
                </div>
              ` : ''}
            </div>
          </div>
          
          <!-- Requirement Details -->
          <div class="section">
            <div class="section-header">
              <h2>Requirement Details</h2>
            </div>
            <div class="section-content">
              <div class="info-grid">
                <div class="info-row">
                  <span class="info-label">Email Subject:</span>
                  <span class="info-value">${enquiry.subject || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Quotation Number:</span>
                  <span class="info-value">${enquiry.enquiry_number || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Product / Item:</span>
                  <span class="info-value">${enquiry.product_name || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Prospective Value:</span>
                  <span class="info-value">${enquiry.prospective_value ? `${enquiry.currency || 'INR'} ${fmt(enquiry.prospective_value)}` : '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Enquiry Assigned to:</span>
                  <span class="info-value">${enquiry.assigned_to_name || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Enquiry Type:</span>
                  <span class="info-value">${enquiry.enquiry_type || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Source of Enquiry:</span>
                  <span class="info-value">${enquiry.source_of_enquiry || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Region:</span>
                  <span class="info-value">${getRegionLabel(enquiry.region)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Regional Manager:</span>
                  <span class="info-value">${enquiry.regional_manager_name || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Priority:</span>
                  <span class="info-value">${enquiry.priority === 'LOW' ? 'Low' : enquiry.priority === 'MEDIUM' ? 'Medium' : enquiry.priority === 'HIGH' ? 'High' : enquiry.priority || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Due Date:</span>
                  <span class="info-value">${enquiry.due_date || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Target Date Submission:</span>
                  <span class="info-value">${enquiry.target_submission_date || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Enquiry Date:</span>
                  <span class="info-value">${enquiry.enquiry_date || '—'}</span>
                </div>
              </div>
              
              ${enquiry.rejection_reason ? `
                <div class="rejection-box">
                  <div class="rejection-label">Rejection / Regret Reason:</div>
                  <div class="rejection-text">${enquiry.rejection_reason}</div>
                </div>
              ` : ''}
            </div>
          </div>
          
          ${enquiry.attachments?.length > 0 ? `
            <!-- Attachments -->
            <div class="section">
              <div class="section-header">
                <h2>Attached Files (${enquiry.attachments.length})</h2>
              </div>
              <div class="section-content">
                <div class="files-grid">
                  ${enquiry.attachments.map(att => {
                    const fileUrl = att.file_url || att.file
                    const fileName = fileUrl.split('/').pop() || 'Unknown file'
                    const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE'
                    return `
                      <div class="file-item">
                        <div class="file-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#122C41" stroke-width="1.8">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" />
                          </svg>
                        </div>
                        <div class="file-info">
                          <div class="file-name">${fileName.replace(/[<>]/g, '')}</div>
                          <div class="file-type">${ext} File</div>
                        </div>
                      </div>
                    `
                  }).join('')}
                </div>
              </div>
            </div>
          ` : ''}
          
          <!-- Footer -->
          <div class="report-footer">
            <p>This is a system-generated report. For any queries, please contact the administrator.</p>
            <p>Generated from Enquiry Management System</p>
          </div>
        </div>
      </body>
    </html>
  `

  const printWindow = window.open('', '_blank')
  printWindow.document.write(printContent)
  printWindow.document.close()
  printWindow.focus()

  printWindow.onload = () => {
    printWindow.print()
  }
}

// Hook for easier usage
export const usePrintEnquiryDetail = () => {
  const printDetail = (enquiry) => {
    printEnquiryDetail(enquiry)
  }
  return { printDetail }
}