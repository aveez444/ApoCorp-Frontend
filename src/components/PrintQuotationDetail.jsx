// src/components/PrintQuotationDetail.jsx

const fmt = n => new Intl.NumberFormat("en-IN").format(n ?? 0)

const REVIEW_STATUS_LABELS = {
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected"
}

const CLIENT_STATUS_LABELS = {
  DRAFT: "Draft",
  SENT: "Sent",
  UNDER_NEGOTIATION: "Under Negotiation",
  ACCEPTED: "Accepted",
  REJECTED_BY_CLIENT: "Rejected by Client"
}

export const printQuotationDetail = (quotation) => {
  if (!quotation) return

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN')
  const timeStr = now.toLocaleTimeString('en-IN')

  const customer = quotation.customer_detail || {}
  const poc = customer.pocs?.find(p => p.is_primary) || customer.pocs?.[0] || {}
  const billing = customer.addresses?.find(a => a.address_type === 'BILLING') || {}
  const loc = [customer.city, customer.country].filter(Boolean).join(', ')

  const getStatusStyle = (status, type = 'review') => {
    const styles = {
      review: {
        UNDER_REVIEW: 'background: #FFF8E1; color: #F59E0B; border-color: #F59E0B44;',
        APPROVED: 'background: #EEFFEE; color: #43A047; border-color: #43A04744;',
        REJECTED: 'background: #FFF5F5; color: #E53935; border-color: #E5393544;'
      },
      client: {
        DRAFT: 'background: #F3F4F6; color: #6B7280; border-color: #9CA3AF44;',
        SENT: 'background: #E2F1FF; color: #1E88E5; border-color: #1E88E544;',
        UNDER_NEGOTIATION: 'background: #FAE7FF; color: #8E24AA; border-color: #8E24AA44;',
        ACCEPTED: 'background: #EEFFEE; color: #43A047; border-color: #43A04744;',
        REJECTED_BY_CLIENT: 'background: #FFF5F5; color: #E53935; border-color: #E5393544;'
      }
    }
    return styles[type][status] || 'background: #f3f4f6; color: #6b7280; border-color: #e5e7eb;'
  }

  const prospectiveValue = quotation.enquiry_prospective_value
    ? `${quotation.enquiry_currency || 'INR'} ${fmt(quotation.enquiry_prospective_value)}`
    : '—'

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Quotation ${quotation.quotation_number || 'Detail'} - ${dateStr}</title>
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
          
          .badge-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-top: 12px;
          }
          
          .badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            border: 1px solid;
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
          
          /* Status Banner */
          .status-banner {
            margin-bottom: 24px;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .rejection-banner {
            background: #FFF5F5;
            border: 1px solid #E5393544;
            color: #b91c1c;
          }
          
          /* Table Styles */
          .products-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }
          
          .products-table th {
            background: #122C41;
            color: white;
            padding: 10px 8px;
            font-size: 10px;
            font-weight: 600;
            text-align: left;
            border: 1px solid #1a3f5c;
          }
          
          .products-table td {
            border: 1px solid #e2e8f0;
            padding: 10px 8px;
            font-size: 11px;
            vertical-align: top;
          }
          
          .products-table tr:nth-child(even) {
            background: #fafafa;
          }
          
          .total-row {
            margin-top: 12px;
            padding: 12px 20px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            text-align: right;
            font-size: 13px;
            font-weight: 600;
            color: #122C41;
          }
          
          .total-amount {
            color: #1E88E5;
            font-size: 14px;
            font-weight: 700;
          }
          
          /* Files Grid */
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
          
          /* Terms Grid */
          .terms-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 16px 24px;
          }
          
          .term-item {
            margin-bottom: 8px;
          }
          
          .term-label {
            font-size: 10px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          
          .term-value {
            font-size: 13px;
            font-weight: 500;
            color: #232323;
          }
          
          /* Follow Ups */
          .followup-item {
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 16px 20px;
            margin-bottom: 16px;
            background: #fafafa;
          }
          
          .followup-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .followup-title {
            font-size: 13px;
            font-weight: 700;
            color: #122C41;
          }
          
          .followup-date {
            font-size: 11px;
            color: #9ca3af;
          }
          
          .followup-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 12px 16px;
          }
          
          .followup-label {
            font-size: 11px;
            font-weight: 600;
            color: #6b7280;
            margin-bottom: 2px;
          }
          
          .followup-value {
            font-size: 13px;
            font-weight: 500;
            color: #232323;
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
            .products-table tr {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-report">
          <!-- Header -->
          <div class="report-header">
            <h1>Quotation</h1>
            <div class="subtitle">Enquiry Management System</div>
            <div class="badge-container">
              <span style="font-size: 22px; font-weight: 700; color: #122C41;">${quotation.quotation_number || '—'}</span>
              <span class="badge" style="${getStatusStyle(quotation.review_status, 'review')}">
                ${REVIEW_STATUS_LABELS[quotation.review_status] || quotation.review_status}
              </span>
              <span class="badge" style="${getStatusStyle(quotation.client_status, 'client')}">
                ${CLIENT_STATUS_LABELS[quotation.client_status] || quotation.client_status}
              </span>
            </div>
            <div class="report-meta">
              <span>Generated: ${dateStr} at ${timeStr}</span>
              <span>Reference ID: ${quotation.id || '—'}</span>
            </div>
          </div>
          
          ${quotation.review_status === 'REJECTED' ? `
            <div class="status-banner rejection-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <span>This quotation was <strong>Rejected</strong> by manager${quotation.manager_remark ? ` — "${quotation.manager_remark}"` : ''}.</span>
            </div>
          ` : quotation.review_status === 'UNDER_REVIEW' ? `
            <div class="status-banner" style="background: #FFF8E1; border: 1px solid #F59E0B44; color: #92400e;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>This quotation is <strong>Under Review</strong> — awaiting manager approval.</span>
            </div>
          ` : ''}
          
          ${quotation.client_status === 'ACCEPTED' ? `
            <div class="status-banner" style="background: #EEFFEE; border: 1px solid #43A04744; color: #166534;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>✓ This quotation has been <strong>Accepted</strong> by the client.${quotation.po_number ? ` PO Number: ${quotation.po_number}` : ''}</span>
            </div>
          ` : quotation.client_status === 'REJECTED_BY_CLIENT' ? `
            <div class="status-banner rejection-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <span>✕ This quotation was <strong>Rejected</strong> by the client.</span>
            </div>
          ` : ''}
          
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
                  <span class="info-value">${poc.name || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Designation:</span>
                  <span class="info-value">${poc.designation || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Phone (Landline):</span>
                  <span class="info-value">${customer.telephone_primary || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Phone (Mobile):</span>
                  <span class="info-value">${poc.phone || customer.telephone_primary || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email ID:</span>
                  <span class="info-value">${poc.email || customer.email || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">City:</span>
                  <span class="info-value">${billing.city || customer.city || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">State:</span>
                  <span class="info-value">${billing.state || customer.state || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Country:</span>
                  <span class="info-value">${customer.country || '—'}</span>
                </div>
              </div>
              ${(billing.address_line || customer.address) ? `
                <div class="info-row" style="margin-top: 8px;">
                  <span class="info-label">Detailed Address:</span>
                  <span class="info-value">${billing.address_line || customer.address || '—'}</span>
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
                <div class="info-row full-width">
                  <span class="info-label">Email Subject:</span>
                  <span class="info-value">${quotation.enquiry_subject || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Quotation Number:</span>
                  <span class="info-value">${quotation.enquiry_number || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Product / Item:</span>
                  <span class="info-value">${quotation.enquiry_product_name || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Prospective Value:</span>
                  <span class="info-value">${prospectiveValue}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Enquiry Assigned to:</span>
                  <span class="info-value">${quotation.assigned_to_name || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Enquiry Type:</span>
                  <span class="info-value">${quotation.enquiry_type || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Source of Enquiry:</span>
                  <span class="info-value">${quotation.enquiry_source || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Region:</span>
                  <span class="info-value">${quotation.enquiry_region || customer.region || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Due Date:</span>
                  <span class="info-value">${quotation.enquiry_due_date || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Target DT Submission:</span>
                  <span class="info-value">${quotation.enquiry_target_date || '—'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Quotation Details -->
          <div class="section">
            <div class="section-header">
              <h2>Quotation Details</h2>
            </div>
            <div class="section-content">
              <div class="info-grid" style="margin-bottom: 16px;">
                <div class="info-row">
                  <span class="info-label">Quotation Amount:</span>
                  <span class="info-value">${quotation.grand_total ? `₹${fmt(quotation.grand_total)}` : '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Quotation Number:</span>
                  <span class="info-value">${quotation.quotation_number || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Quotation Date:</span>
                  <span class="info-value">${quotation.created_at ? new Date(quotation.created_at).toLocaleDateString('en-IN') : '—'}</span>
                </div>
              </div>
              
              ${quotation.line_items?.length > 0 ? `
                <div style="font-size: 13px; font-weight: 600; color: #122C41; margin-bottom: 10px;">
                  Product Details (${quotation.line_items.length})
                </div>
                <div style="overflow-x: auto;">
                  <table class="products-table">
                    <thead>
                      <tr>
                        <th style="width: 28%">Product Name</th>
                        <th style="width: 8%">Job Code</th>
                        <th style="width: 8%">Cust. Part No</th>
                        <th style="width: 8%">Part No.</th>
                        <th style="width: 6%">HSN</th>
                        <th style="width: 6%">Qty</th>
                        <th style="width: 6%">Unit</th>
                        <th style="width: 10%">Unit Price</th>
                        <th style="width: 10%">Total</th>
                        <th style="width: 6%">Tax %</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${quotation.line_items.map(item => `
                        <tr>
                          <td style="word-wrap: break-word; word-break: break-word;">${item.product_name_snapshot || '—'}</td>
                          <td>${item.job_code || '—'}</td>
                          <td>${item.customer_part_no || '—'}</td>
                          <td>${item.part_no || '—'}</td>
                          <td>${item.hsn_snapshot || '—'}</td>
                          <td style="text-align: right;">${item.quantity || '—'}</td>
                          <td>${item.unit_snapshot || '—'}</td>
                          <td style="text-align: right;">₹${fmt(item.unit_price)}</td>
                          <td style="text-align: right; font-weight: 600; color: #1E88E5;">₹${fmt(item.line_total)}</td>
                          <td style="text-align: center;">${item.tax_percent}%</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
                <div class="total-row">
                  Subtotal: <strong>₹${fmt(quotation.total_amount)}</strong> &nbsp;|&nbsp;
                  Tax: <strong>₹${fmt(quotation.tax_amount)}</strong> &nbsp;|&nbsp;
                  <span class="total-amount">Grand Total: ₹${fmt(quotation.grand_total)}</span>
                </div>
              ` : ''}
            </div>
          </div>
          
          <!-- Commercial Terms -->
          ${quotation.terms && Object.values(quotation.terms).some(v => v) ? `
            <div class="section">
              <div class="section-header">
                <h2>Commercial Terms & Conditions</h2>
              </div>
              <div class="section-content">
                <div class="terms-grid">
                  ${quotation.terms.payment_terms ? `
                    <div class="term-item">
                      <div class="term-label">Payment Terms</div>
                      <div class="term-value">${quotation.terms.payment_terms}</div>
                    </div>
                  ` : ''}
                  ${quotation.terms.sales_tax ? `
                    <div class="term-item">
                      <div class="term-label">Sales Tax</div>
                      <div class="term-value">${quotation.terms.sales_tax}</div>
                    </div>
                  ` : ''}
                  ${quotation.terms.excise_duty ? `
                    <div class="term-item">
                      <div class="term-label">Excise Duty</div>
                      <div class="term-value">${quotation.terms.excise_duty}</div>
                    </div>
                  ` : ''}
                  ${quotation.terms.warranty ? `
                    <div class="term-item">
                      <div class="term-label">Warranty</div>
                      <div class="term-value">${quotation.terms.warranty}</div>
                    </div>
                  ` : ''}
                  ${quotation.terms.packing_forwarding ? `
                    <div class="term-item">
                      <div class="term-label">Packing & Forwarding</div>
                      <div class="term-value">${quotation.terms.packing_forwarding}</div>
                    </div>
                  ` : ''}
                  ${quotation.terms.price_basis ? `
                    <div class="term-item">
                      <div class="term-label">Price Basis</div>
                      <div class="term-value">${quotation.terms.price_basis}</div>
                    </div>
                  ` : ''}
                  ${quotation.terms.insurance ? `
                    <div class="term-item">
                      <div class="term-label">Insurance</div>
                      <div class="term-value">${quotation.terms.insurance}</div>
                    </div>
                  ` : ''}
                  ${quotation.terms.freight ? `
                    <div class="term-item">
                      <div class="term-label">Freight</div>
                      <div class="term-value">${quotation.terms.freight}</div>
                    </div>
                  ` : ''}
                  ${quotation.terms.delivery ? `
                    <div class="term-item">
                      <div class="term-label">Delivery</div>
                      <div class="term-value">${quotation.terms.delivery}</div>
                    </div>
                  ` : ''}
                  ${quotation.terms.validity ? `
                    <div class="term-item">
                      <div class="term-label">Validity</div>
                      <div class="term-value">${quotation.terms.validity}</div>
                    </div>
                  ` : ''}
                  ${quotation.terms.decision_expected ? `
                    <div class="term-item">
                      <div class="term-label">Decision Expected</div>
                      <div class="term-value">${quotation.terms.decision_expected}</div>
                    </div>
                  ` : ''}
                  ${quotation.terms.remarks ? `
                    <div class="term-item">
                      <div class="term-label">Remarks</div>
                      <div class="term-value">${quotation.terms.remarks}</div>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          ` : ''}
          
          <!-- Follow Ups -->
          ${quotation.follow_ups?.length > 0 ? `
            <div class="section">
              <div class="section-header">
                <h2>Follow Ups (${quotation.follow_ups.length})</h2>
              </div>
              <div class="section-content">
                ${quotation.follow_ups.map((fu, idx) => `
                  <div class="followup-item">
                    <div class="followup-header">
                      <span class="followup-title">Follow Up #${idx + 1}</span>
                      <span class="followup-date">${fu.created_at ? `Created: ${new Date(fu.created_at).toLocaleDateString()}` : ''}</span>
                    </div>
                    <div class="followup-grid">
                      <div>
                        <div class="followup-label">Follow Up Date</div>
                        <div class="followup-value">${fu.follow_up_date || '—'}</div>
                      </div>
                      <div>
                        <div class="followup-label">Contact Person</div>
                        <div class="followup-value">${fu.contact_person || '—'}</div>
                      </div>
                      <div>
                        <div class="followup-label">Contact Phone</div>
                        <div class="followup-value">${fu.contact_phone || '—'}</div>
                      </div>
                      <div>
                        <div class="followup-label">Contact Email</div>
                        <div class="followup-value">${fu.contact_email || '—'}</div>
                      </div>
                      ${fu.remarks ? `
                        <div style="grid-column: span 2;">
                          <div class="followup-label">Remarks</div>
                          <div class="followup-value">${fu.remarks}</div>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <!-- Attachments -->
          ${quotation.attachments?.length > 0 ? `
            <div class="section">
              <div class="section-header">
                <h2>Attached Files (${quotation.attachments.length})</h2>
              </div>
              <div class="section-content">
                <div class="files-grid">
                  ${quotation.attachments.map(att => {
                    const fileUrl = att.file_url || att.file
                    const fileName = (fileUrl?.split('/').pop() || 'Unknown file').replace(/[<>]/g, '')
                    const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE'
                    return `
                      <div class="file-item">
                        <div class="file-icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#122C41" stroke-width="1.8">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" />
                          </svg>
                        </div>
                        <div class="file-info">
                          <div class="file-name">${fileName}</div>
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
            <p>This is a system-generated quotation document. For any queries, please contact the administrator.</p>
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
export const usePrintQuotationDetail = () => {
  const printDetail = (quotation) => {
    printQuotationDetail(quotation)
  }
  return { printDetail }
}