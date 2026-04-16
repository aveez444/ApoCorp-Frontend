// src/components/PrintOADetail.jsx

const fmt = n => new Intl.NumberFormat("en-IN").format(n ?? 0)

const STATUS_LABELS = {
  DRAFT: "Draft",
  SHARED: "Shared",
  CONVERTED: "Converted to Order"
}

const ORDER_TYPE_LABELS = {
  'std.mfg.comp': 'Standard Manufacturing',
  'service': 'Service',
  'trading': 'Trading',
  'project': 'Project'
}

export const printOADetail = (oa) => {
  if (!oa) return

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN')
  const timeStr = now.toLocaleTimeString('en-IN')

  const customer = oa.customer_detail || {}
  const primaryPOC = customer.pocs?.find(p => p.is_primary) || customer.pocs?.[0] || {}
  const billing = oa.billing_snapshot || {}
  const shipping = oa.shipping_snapshot || {}
  const transport = oa.transport_details || {}
  const commercial = oa.commercial_terms || {}
  const lineItems = oa.line_items || []

  // Calculate totals from line items if not provided
  let subTotal = 0, totalTax = 0, grandTotal = 0
  if (lineItems.length > 0) {
    lineItems.forEach(item => {
      const qty = Number(item.quantity) || 0
      const price = Number(item.unit_price) || 0
      const taxPct = Number(item.tax_percent) || 0
      const lineExcl = qty * price
      const lineTax = lineExcl * (taxPct / 100)
      subTotal += lineExcl
      totalTax += lineTax
    })
    grandTotal = subTotal + totalTax
  } else {
    subTotal = commercial.net_amount || 0
    totalTax = (commercial.igst || 0) + (commercial.cgst || 0) + (commercial.sgst || 0)
    grandTotal = commercial.total_amount || 0
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'CONVERTED': return '#1e88e5'
      case 'SHARED': return '#f59e0b'
      default: return '#16a34a'
    }
  }

  const getStatusBg = (status) => {
    switch(status) {
      case 'CONVERTED': return '#e2f1ff'
      case 'SHARED': return '#fffbeb'
      default: return '#f0fdf4'
    }
  }

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Order Acknowledgment ${oa.oa_number || 'Detail'} - ${dateStr}</title>
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
          
          /* Address Cards */
          .address-row {
            display: flex;
            gap: 24px;
            flex-wrap: wrap;
          }
          
          .address-card {
            flex: 1;
            min-width: 280px;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            overflow: hidden;
          }
          
          .address-header {
            padding: 12px 16px;
            background: #fafbfd;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .address-header h3 {
            font-size: 13px;
            font-weight: 700;
            color: #122C41;
            margin: 0;
          }
          
          .address-body {
            padding: 16px;
          }
          
          .address-line {
            margin-bottom: 10px;
            font-size: 13px;
          }
          
          .address-label {
            color: #64748b;
            font-weight: 500;
            min-width: 100px;
            display: inline-block;
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
          
          /* Transport Grid */
          .transport-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px 24px;
          }
          
          .transport-item {
            margin-bottom: 4px;
          }
          
          .transport-label {
            font-size: 10px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          
          /* Factory Contacts */
          .contact-group {
            margin-bottom: 20px;
          }
          
          .contact-title {
            font-size: 12px;
            font-weight: 700;
            color: #122C41;
            margin-bottom: 10px;
            padding-bottom: 6px;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .contact-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 12px;
          }
          
          .contact-field {
            font-size: 12px;
          }
          
          .contact-field-label {
            color: #64748b;
            font-weight: 500;
            margin-right: 6px;
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
            <h1>Order Acknowledgment</h1>
            <div class="subtitle">Enquiry Management System</div>
            <div class="badge-container">
              <span style="font-size: 22px; font-weight: 700; color: #122C41;">${oa.oa_number || '—'}</span>
              <span class="badge" style="background: ${getStatusBg(oa.status)}; color: ${getStatusColor(oa.status)}; border-color: ${getStatusColor(oa.status)}44;">
                ${STATUS_LABELS[oa.status] || oa.status || 'Draft'}
              </span>
            </div>
            <div class="report-meta">
              <span>Generated: ${dateStr} at ${timeStr}</span>
              <span>Reference ID: ${oa.id || '—'}</span>
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
                  <span class="info-value">${primaryPOC.name || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Designation:</span>
                  <span class="info-value">${primaryPOC.designation || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Phone (Landline):</span>
                  <span class="info-value">${customer.telephone_primary || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Phone (Mobile):</span>
                  <span class="info-value">${primaryPOC.phone || customer.telephone_primary || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email ID:</span>
                  <span class="info-value">${primaryPOC.email || customer.email || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">City:</span>
                  <span class="info-value">${customer.city || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">State:</span>
                  <span class="info-value">${customer.state || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Country:</span>
                  <span class="info-value">${customer.country || '—'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Order Details -->
          <div class="section">
            <div class="section-header">
              <h2>Order Details</h2>
            </div>
            <div class="section-content">
              <div class="info-grid">
                <div class="info-row">
                  <span class="info-label">Order Number:</span>
                  <span class="info-value">${transport.order_number || oa.oa_number || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Order Type:</span>
                  <span class="info-value">${ORDER_TYPE_LABELS[transport.order_type] || transport.order_type || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Order Date:</span>
                  <span class="info-value">${transport.order_date || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Quote Date:</span>
                  <span class="info-value">${transport.quote_date || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Order Book Number:</span>
                  <span class="info-value">${transport.order_book_number || oa.oa_number || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Customer PO Number:</span>
                  <span class="info-value">${transport.customer_po_number || 'NA'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">PO Date:</span>
                  <span class="info-value">${transport.po_date || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Delivery Date:</span>
                  <span class="info-value">${transport.delivery_date || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Division:</span>
                  <span class="info-value">${transport.division || 'LQP'}</span>
                </div>
                <div class="info-row full-width">
                  <span class="info-label">Project Type:</span>
                  <span class="info-value">${transport.project_type || '—'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Transportation Details -->
          <div class="section">
            <div class="section-header">
              <h2>Transportation Details</h2>
            </div>
            <div class="section-content">
              <div class="transport-grid">
                <div class="transport-item">
                  <div class="transport-label">Mode of Transport</div>
                  <div class="term-value">${transport.mode_of_transport || 'By Road'}</div>
                </div>
                <div class="transport-item">
                  <div class="transport-label">Preferred Transporter</div>
                  <div class="term-value">${transport.preferred_transporter || 'Will be intimated later'}</div>
                </div>
                <div class="transport-item">
                  <div class="transport-label">Packing Type</div>
                  <div class="term-value">${transport.packing_type || 'Card Board'}</div>
                </div>
                <div class="transport-item">
                  <div class="transport-label">ECC Exemption Letter</div>
                  <div class="term-value">${transport.ecc_exemption || 'Not Applicable'}</div>
                </div>
                <div class="transport-item">
                  <div class="transport-label">Road Permit</div>
                  <div class="term-value">${transport.road_permit || 'Not Required'}</div>
                </div>
                <div class="transport-item">
                  <div class="transport-label">Shipping GST Number</div>
                  <div class="term-value">${transport.shipping_gst || 'Not Required'}</div>
                </div>
                <div class="transport-item">
                  <div class="transport-label">LOI Number</div>
                  <div class="term-value">${transport.loi_number || 'NA'}</div>
                </div>
                <div class="transport-item">
                  <div class="transport-label">Project Name</div>
                  <div class="term-value">${transport.project_name || 'NA'}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Billing & Shipping Addresses -->
          <div class="section">
            <div class="section-header">
              <h2>Billing & Shipping Details</h2>
            </div>
            <div class="section-content">
              <div class="address-row">
                <!-- Bill To -->
                <div class="address-card">
                  <div class="address-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="1.8">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    <h3>Bill To</h3>
                  </div>
                  <div class="address-body">
                    <div class="address-line">
                      <span class="address-label">Entity Name:</span>
                      <span>${billing.entity_name || '—'}</span>
                    </div>
                    <div class="address-line">
                      <span class="address-label">Address:</span>
                      <span>${billing.address_line || '—'}</span>
                    </div>
                    <div class="address-line">
                      <span class="address-label">Contact Person:</span>
                      <span>${billing.contact_person || '—'}</span>
                    </div>
                    <div class="address-line">
                      <span class="address-label">Email:</span>
                      <span>${billing.contact_email || '—'}</span>
                    </div>
                    <div class="address-line">
                      <span class="address-label">Phone:</span>
                      <span>${billing.contact_number || '—'}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Ship To -->
                <div class="address-card">
                  <div class="address-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="1.8">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    <h3>Ship To</h3>
                  </div>
                  <div class="address-body">
                    <div class="address-line">
                      <span class="address-label">Entity Name:</span>
                      <span>${shipping.entity_name || '—'}</span>
                    </div>
                    <div class="address-line">
                      <span class="address-label">Address:</span>
                      <span>${shipping.address_line || '—'}</span>
                    </div>
                    <div class="address-line">
                      <span class="address-label">Contact Person:</span>
                      <span>${shipping.contact_person || '—'}</span>
                    </div>
                    <div class="address-line">
                      <span class="address-label">Email:</span>
                      <span>${shipping.contact_email || '—'}</span>
                    </div>
                    <div class="address-line">
                      <span class="address-label">Phone:</span>
                      <span>${shipping.contact_number || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Line Items -->
          <div class="section">
            <div class="section-header">
              <h2>Order Details (Line Items)</h2>
            </div>
            <div class="section-content">
              ${lineItems.length > 0 ? `
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
                        <th style="width: 10%">Tax %</th>
                        <th style="width: 10%">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${lineItems.map(item => `
                        <tr>
                          <td style="word-wrap: break-word; word-break: break-word;">${item.product_name_snapshot || item.description || '—'}</td>
                          <td>${item.job_code || '—'}</td>
                          <td>${item.customer_part_no || '—'}</td>
                          <td>${item.part_no || '—'}</td>
                          <td>${item.hsn_code || '—'}</td>
                          <td style="text-align: right;">${item.quantity || '—'}</td>
                          <td>${item.unit || 'NOS'}</td>
                          <td style="text-align: right;">₹${fmt(item.unit_price)}</td>
                          <td style="text-align: center;">${item.tax_percent || '—'}%</td>
                          <td style="text-align: right; font-weight: 600; color: #1E88E5;">₹${fmt(item.total || (item.quantity * item.unit_price))}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
                <div class="total-row">
                  Subtotal: <strong>₹${fmt(subTotal)}</strong> &nbsp;|&nbsp;
                  Tax: <strong>₹${fmt(totalTax)}</strong> &nbsp;|&nbsp;
                  <span class="total-amount">Total Order Value: ₹${fmt(grandTotal)}</span>
                </div>
                <div style="text-align: right; font-size: 12px; color: #6b7280; margin-top: 8px;">
                  Rupees ${grandTotal.toLocaleString()} Only
                </div>
              ` : `
                <div style="text-align: center; padding: 32px; color: #9ca3af; font-size: 13px;">
                  No line items available.
                </div>
              `}
            </div>
          </div>
          
          <!-- Commercial Terms -->
          <div class="section">
            <div class="section-header">
              <h2>Commercial Terms & Conditions</h2>
            </div>
            <div class="section-content">
              <div class="terms-grid">
                ${commercial.payment_terms ? `
                  <div class="term-item">
                    <div class="term-label">Payment Terms</div>
                    <div class="term-value">${commercial.payment_terms}</div>
                  </div>
                ` : ''}
                ${commercial.price_basis ? `
                  <div class="term-item">
                    <div class="term-label">Price Basis</div>
                    <div class="term-value">${commercial.price_basis}</div>
                  </div>
                ` : ''}
                ${commercial.warranty ? `
                  <div class="term-item">
                    <div class="term-label">Warranty</div>
                    <div class="term-value">${commercial.warranty}</div>
                  </div>
                ` : ''}
                ${commercial.insurance ? `
                  <div class="term-item">
                    <div class="term-label">Insurance</div>
                    <div class="term-value">${commercial.insurance}</div>
                  </div>
                ` : ''}
                ${commercial.inspection ? `
                  <div class="term-item">
                    <div class="term-label">Inspection</div>
                    <div class="term-value">${commercial.inspection}</div>
                  </div>
                ` : ''}
                ${commercial.freight_charges ? `
                  <div class="term-item">
                    <div class="term-label">Freight Charges</div>
                    <div class="term-value">${commercial.freight_charges}</div>
                  </div>
                ` : ''}
                ${commercial.drawing_approval ? `
                  <div class="term-item">
                    <div class="term-label">Drawing Approval</div>
                    <div class="term-value">${commercial.drawing_approval}</div>
                  </div>
                ` : ''}
                ${commercial.test_certificate ? `
                  <div class="term-item">
                    <div class="term-label">Test Certificate</div>
                    <div class="term-value">${commercial.test_certificate}</div>
                  </div>
                ` : ''}
                ${commercial.dispatch_clearance ? `
                  <div class="term-item">
                    <div class="term-label">Dispatch Clearance</div>
                    <div class="term-value">${commercial.dispatch_clearance}</div>
                  </div>
                ` : ''}
                ${commercial.commissioning_support ? `
                  <div class="term-item">
                    <div class="term-label">Commissioning Support</div>
                    <div class="term-value">${commercial.commissioning_support}</div>
                  </div>
                ` : ''}
                ${commercial.ld_clause ? `
                  <div class="term-item">
                    <div class="term-label">LD Clause</div>
                    <div class="term-value">${commercial.ld_clause}</div>
                  </div>
                ` : ''}
                ${commercial.abg_format ? `
                  <div class="term-item">
                    <div class="term-label">ABG Format</div>
                    <div class="term-value">${commercial.abg_format}</div>
                  </div>
                ` : ''}
                ${commercial.pbg_format ? `
                  <div class="term-item">
                    <div class="term-label">PBG Format</div>
                    <div class="term-value">${commercial.pbg_format}</div>
                  </div>
                ` : ''}
              </div>
              
              <!-- Tax Summary -->
              <div style="margin-top: 20px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                <div style="margin-bottom: 8px; font-weight: 600; color: #122C41; font-size: 12px;">Tax Summary</div>
                <div style="display: flex; gap: 24px; flex-wrap: wrap;">
                  ${commercial.igst ? `<div><span style="color: #64748b;">IGST:</span> <strong>₹${fmt(commercial.igst)}</strong></div>` : ''}
                  ${commercial.cgst ? `<div><span style="color: #64748b;">CGST:</span> <strong>₹${fmt(commercial.cgst)}</strong></div>` : ''}
                  ${commercial.sgst ? `<div><span style="color: #64748b;">SGST:</span> <strong>₹${fmt(commercial.sgst)}</strong></div>` : ''}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Factory Details / Contacts -->
          <div class="section">
            <div class="section-header">
              <h2>Key Contacts</h2>
            </div>
            <div class="section-content">
              ${commercial.order_processing_name || commercial.regional_manager_name || commercial.project_exec_name ? `
                <div class="contact-group">
                  <div class="contact-title">Order Processing</div>
                  <div class="contact-row">
                    <div class="contact-field"><span class="contact-field-label">Name:</span> ${commercial.order_processing_name || '—'}</div>
                    <div class="contact-field"><span class="contact-field-label">Email:</span> ${commercial.order_processing_email || '—'}</div>
                    <div class="contact-field"><span class="contact-field-label">Phone:</span> ${commercial.order_processing_phone || '—'}</div>
                  </div>
                </div>
                
                <div class="contact-group">
                  <div class="contact-title">Regional Manager</div>
                  <div class="contact-row">
                    <div class="contact-field"><span class="contact-field-label">Name:</span> ${commercial.regional_manager_name || '—'}</div>
                    <div class="contact-field"><span class="contact-field-label">Email:</span> ${commercial.regional_manager_email || '—'}</div>
                    <div class="contact-field"><span class="contact-field-label">Phone:</span> ${commercial.regional_manager_phone || '—'}</div>
                  </div>
                </div>
                
                <div class="contact-group">
                  <div class="contact-title">Project Executive</div>
                  <div class="contact-row">
                    <div class="contact-field"><span class="contact-field-label">Name:</span> ${commercial.project_exec_name || '—'}</div>
                    <div class="contact-field"><span class="contact-field-label">Email:</span> ${commercial.project_exec_email || '—'}</div>
                    <div class="contact-field"><span class="contact-field-label">Phone:</span> ${commercial.project_exec_phone || '—'}</div>
                  </div>
                </div>
              ` : '<div style="color: #9ca3af; text-align: center;">No contact details available</div>'}
              
              <!-- Channel Partner -->
              ${commercial.channel_partner_name && commercial.channel_partner_name !== 'None' ? `
                <div class="contact-group" style="margin-top: 16px;">
                  <div class="contact-title">Channel Partner</div>
                  <div class="contact-row">
                    <div class="contact-field"><span class="contact-field-label">Name:</span> ${commercial.channel_partner_name}</div>
                    <div class="contact-field"><span class="contact-field-label">Commission:</span> ${commercial.commission_percentage || '0'}%</div>
                    <div class="contact-field"><span class="contact-field-label">Amount:</span> ₹${fmt(commercial.commission_amount)}</div>
                  </div>
                </div>
              ` : ''}
              
              ${commercial.consultant_name && commercial.consultant_name !== 'None' ? `
                <div class="contact-group">
                  <div class="contact-title">Consultant</div>
                  <div class="contact-row">
                    <div class="contact-field"><span class="contact-field-label">Name:</span> ${commercial.consultant_name}</div>
                    <div class="contact-field"><span class="contact-field-label">Charges:</span> ₹${fmt(commercial.consultant_charges)}</div>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
          
          <!-- Footer -->
          <div class="report-footer">
            <p>This is a system-generated Order Acknowledgment document. For any queries, please contact the administrator.</p>
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
export const usePrintOADetail = () => {
  const printDetail = (oa) => {
    printOADetail(oa)
  }
  return { printDetail }
}