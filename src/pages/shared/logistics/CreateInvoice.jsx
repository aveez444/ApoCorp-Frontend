// pages/shared/logistics/CreateInvoice.jsx
import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../../../api/axios'

const PRIMARY = "#122C41"
const BORDER = "#e2e8f0"
const FONT = "'Inter', 'Segoe UI', sans-serif"
const fmtAmt = n => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n ?? 0)}`

// ── Shared UI helpers ──────────────────────────────────────────────────────────

function Field({ label, children, style }) {
  return (
    <div style={{ position: "relative", ...style }}>
      <span style={{
        position: "absolute", top: -9, left: 12, background: "#fff",
        padding: "0 4px", fontSize: 11, color: "#64748b", fontWeight: 600,
        pointerEvents: "none", zIndex: 1, whiteSpace: "nowrap", letterSpacing: ".02em"
      }}>{label}</span>
      {children}
    </div>
  )
}

function Input({ value, onChange, type = "text", readOnly, placeholder, style }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={onChange}
      readOnly={readOnly}
      placeholder={placeholder}
      style={{
        border: `1.5px solid ${readOnly ? "#f1f5f9" : BORDER}`,
        borderRadius: 8, padding: "11px 14px",
        fontSize: 13, fontFamily: FONT, width: "100%",
        background: readOnly ? "#f8fafc" : "#fff",
        color: readOnly ? "#94a3b8" : "#1e293b",
        outline: "none", boxSizing: "border-box",
        transition: "border-color .15s",
        ...style
      }}
      onFocus={e => { if (!readOnly) e.target.style.borderColor = PRIMARY }}
      onBlur={e => { e.target.style.borderColor = readOnly ? "#f1f5f9" : BORDER }}
    />
  )
}

function Textarea({ value, onChange, rows = 3, readOnly, style }) {
  return (
    <textarea
      value={value ?? ""}
      onChange={onChange}
      rows={rows}
      readOnly={readOnly}
      style={{
        border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: "11px 14px",
        fontSize: 13, fontFamily: FONT, width: "100%",
        background: readOnly ? "#f8fafc" : "#fff",
        color: "#1e293b", outline: "none", boxSizing: "border-box",
        resize: "vertical", ...style
      }}
    />
  )
}

function Select({ value, onChange, children, style }) {
  return (
    <select
      value={value ?? ""}
      onChange={onChange}
      style={{
        border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: "11px 14px",
        fontSize: 13, fontFamily: FONT, width: "100%",
        background: "#fff", color: "#1e293b",
        outline: "none", boxSizing: "border-box", cursor: "pointer", ...style
      }}
    >
      {children}
    </select>
  )
}

function StatusBadge({ status }) {
  const map = {
    DRAFT:     { bg: "#fffbe6", color: "#c8860a", dot: "#f0a500", label: "Draft" },
    CONFIRMED: { bg: "#e6fff5", color: "#0a9e6e", dot: "#0fc878", label: "Confirmed" },
    CANCELLED: { bg: "#fef2f2", color: "#dc2626", dot: "#ef4444", label: "Cancelled" },
  }
  const s = map[status] || { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8", label: status }
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "4px 12px", borderRadius: 20,
      fontSize: 12, fontWeight: 700,
      display: "inline-flex", alignItems: "center", gap: 5
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot }} />
      {s.label}
    </span>
  )
}

// ── Stepper ────────────────────────────────────────────────────────────────────

function Stepper({ step, setStep }) {
  const steps = [
    { n: 1, label: "Invoice Details" },
    { n: 2, label: "Address & Products" },
    { n: 3, label: "Logistics Details" },
  ]
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 0 32px", gap: 0 }}>
      {steps.map((s, i) => {
        const done = step > s.n
        const active = step === s.n
        return (
          <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", minWidth: 100 }}
              onClick={() => setStep(s.n)}
            >
              <div style={{
                width: 42, height: 42, borderRadius: "50%",
                background: (done || active) ? PRIMARY : "#fff",
                border: `2px solid ${(done || active) ? PRIMARY : "#cbd5e1"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: (done || active) ? "#fff" : "#94a3b8",
                fontSize: 15, fontWeight: 700,
                transition: "all .2s",
              }}>
                {done ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : s.n}
              </div>
              <div style={{
                fontSize: 11.5, fontWeight: active ? 700 : 500,
                color: active ? PRIMARY : "#64748b",
                marginTop: 8, textAlign: "center", lineHeight: 1.4,
              }}>
                {s.label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                height: 2, width: 80,
                background: step > s.n ? PRIMARY : "#e2e8f0",
                marginBottom: 20, flexShrink: 0,
                transition: "background .3s"
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Order Detail Tab ───────────────────────────────────────────────────────────

function OrderDetailTab({ oaLineItems }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12,
      border: `1px solid ${BORDER}`, marginTop: 24, marginBottom: 24, overflow: "hidden"
    }}>
      <div style={{
        padding: "14px 20px", borderBottom: `1px solid ${BORDER}`,
        fontWeight: 700, fontSize: 13, color: PRIMARY,
        display: "flex", alignItems: "center", gap: 8
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Full Order Line Items (Reference)
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Job Code", "Cust. Part No", "Part No.", "Description", "HSN", "Qty", "Unit", "Unit Price", "Tax %", "Total"].map(h => (
                <th key={h} style={{
                  background: "#f8fafc", color: "#475569",
                  fontSize: 11, fontWeight: 700, padding: "11px 13px",
                  textAlign: h === "Qty" || h === "Unit Price" || h === "Tax %" || h === "Total" ? "right" : "left",
                  whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: ".04em",
                  borderBottom: `1px solid ${BORDER}`
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {oaLineItems.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: "center", padding: 32, color: "#94a3b8", fontSize: 13 }}>No order line items found.</td></tr>
            ) : oaLineItems.map((li, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "11px 13px", fontSize: 12.5, color: "#374151" }}>{li.job_code || "—"}</td>
                <td style={{ padding: "11px 13px", fontSize: 12.5 }}>{li.customer_part_no || "—"}</td>
                <td style={{ padding: "11px 13px", fontSize: 12.5, fontFamily: "monospace" }}>{li.part_no || "—"}</td>
                <td style={{ padding: "11px 13px", fontSize: 12.5, maxWidth: 180 }}>
                  <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {li.description || "—"}
                  </span>
                </td>
                <td style={{ padding: "11px 13px", fontSize: 12.5 }}>{li.hsn_code || "—"}</td>
                <td style={{ padding: "11px 13px", fontSize: 12.5, textAlign: "right", fontWeight: 600 }}>{li.quantity}</td>
                <td style={{ padding: "11px 13px", fontSize: 12.5 }}>{li.unit || "NOS"}</td>
                <td style={{ padding: "11px 13px", fontSize: 12.5, textAlign: "right" }}>{fmtAmt(li.unit_price)}</td>
                <td style={{ padding: "11px 13px", fontSize: 12.5, textAlign: "right" }}>{li.tax_percent ?? 0}%</td>
                <td style={{ padding: "11px 13px", fontSize: 12.5, fontWeight: 600, textAlign: "right", color: PRIMARY }}>{fmtAmt(li.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Address Card ──────────────────────────────────────────────────────────────

function AddressCard({ title, data, onChange, accentColor }) {
  if (!data) return null
  return (
    <div style={{ border: `1.5px solid ${accentColor}20`, borderRadius: 10, padding: 20, background: "#fff" }}>
      <div style={{
        fontSize: 12, fontWeight: 700, color: accentColor,
        textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 16,
        paddingBottom: 10, borderBottom: `1px solid ${accentColor}20`
      }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Entity Name">
          <Input value={data.entity_name} onChange={e => onChange({ ...data, entity_name: e.target.value })} />
        </Field>
        <Field label="Address">
          <Textarea
            value={data.address_line}
            onChange={e => onChange({ ...data, address_line: e.target.value })}
            rows={2}
          />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="City">
            <Input value={data.city} onChange={e => onChange({ ...data, city: e.target.value })} />
          </Field>
          <Field label="State">
            <Input value={data.state} onChange={e => onChange({ ...data, state: e.target.value })} />
          </Field>
          <Field label="Pincode">
            <Input value={data.pincode} onChange={e => onChange({ ...data, pincode: e.target.value })} />
          </Field>
          <Field label="Country">
            <Input value={data.country} onChange={e => onChange({ ...data, country: e.target.value })} />
          </Field>
        </div>
      </div>
    </div>
  )
}

// ── Invoicing Tab (3-step) ─────────────────────────────────────────────────────

function InvoicingTab({
  step, setStep,
  step1, setStep1,
  billTo, setBillTo,
  shipTo, setShipTo,
  contact, setContact,
  gst, setGst,
  lineItems, setLineItems,
  step3, setStep3,
  totals,
  invoice,
  saving,
  handleSave,
  handleConfirm,
  isNew,
  backorder,  // ← ADD THIS
}) {
  return (
    <div style={{
      background: "#fff", borderRadius: 12,
      border: `1px solid ${BORDER}`, marginTop: 24, overflow: "hidden"
    }}>
      {/* Tab inner header */}
      <div style={{
        padding: "16px 24px", borderBottom: `1px solid ${BORDER}`,
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: PRIMARY }}>
            {isNew ? "Create Invoice" : "Edit Invoice"}
          </span>
          {invoice?.invoice_number && (
            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
              #{invoice.invoice_number}
            </span>
          )}
        </div>
        {invoice?.status && <StatusBadge status={invoice.status} />}
      </div>

      {/* Stepper */}
      <Stepper step={step} setStep={setStep} />

      <div style={{ padding: "0 28px 8px" }}>

        {/* ── Step 1: Invoice Details ── */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: PRIMARY, marginBottom: 20, paddingBottom: 10, borderBottom: `1px solid ${BORDER}` }}>
              Invoice Details
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <Field label="PO Number">
                <Input value={step1.po_number} onChange={e => setStep1(p => ({ ...p, po_number: e.target.value }))} />
              </Field>
              <Field label="PO Date">
                <Input type="date" value={step1.po_date} onChange={e => setStep1(p => ({ ...p, po_date: e.target.value }))} />
              </Field>
              <Field label="Invoice Number">
                <Input value={step1.invoice_number || "(auto-generated on save)"} readOnly />
              </Field>
              <Field label="Invoice Date">
                <Input type="date" value={step1.invoice_date} onChange={e => setStep1(p => ({ ...p, invoice_date: e.target.value }))} />
              </Field>
              <Field label="AMD Number">
                <Input value={step1.amd_number} onChange={e => setStep1(p => ({ ...p, amd_number: e.target.value }))} />
              </Field>
              <Field label="AMD Date">
                <Input type="date" value={step1.amd_date} onChange={e => setStep1(p => ({ ...p, amd_date: e.target.value }))} />
              </Field>
              <Field label="Location / Division">
                <Input value={step1.location} onChange={e => setStep1(p => ({ ...p, location: e.target.value }))} />
              </Field>
              <Field label="Invoice Type">
                <Select value={step1.invoice_type} onChange={e => setStep1(p => ({ ...p, invoice_type: e.target.value }))}>
                  <option value="">Select Type</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Excise">Excise</option>
                  <option value="Service">Service</option>
                  <option value="Trading">Trading</option>
                </Select>
              </Field>
            </div>
          </div>
        )}

        {/* ── Step 2: Address & Products ── */}
        {step === 2 && (
          <div>
            {/* Addresses */}
            <div style={{ fontSize: 13, fontWeight: 700, color: PRIMARY, marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${BORDER}` }}>
              Bill To / Ship To
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
              <AddressCard title="Bill To" data={billTo} onChange={setBillTo} accentColor="#3b82f6" />
              <AddressCard title="Ship To" data={shipTo} onChange={setShipTo} accentColor="#f59e0b" />
            </div>

            {/* Contact */}
            <div style={{ fontSize: 13, fontWeight: 700, color: PRIMARY, marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${BORDER}` }}>
              Contact Person
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 28 }}>
              <Field label="Name">
                <Input value={contact.name} onChange={e => setContact(p => ({ ...p, name: e.target.value }))} />
              </Field>
              <Field label="Contact Number">
                <Input value={contact.number} onChange={e => setContact(p => ({ ...p, number: e.target.value }))} />
              </Field>
              <Field label="Email">
                <Input value={contact.email} onChange={e => setContact(p => ({ ...p, email: e.target.value }))} />
              </Field>
            </div>

            {/* GST */}
            <div style={{ fontSize: 13, fontWeight: 700, color: PRIMARY, marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${BORDER}` }}>
              GST Details
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 28 }}>
              <Field label="Consignor GST">
                <Input value={gst.consignor} onChange={e => setGst(p => ({ ...p, consignor: e.target.value }))} />
              </Field>
              <Field label="Consignee GST">
                <Input value={gst.consignee} onChange={e => setGst(p => ({ ...p, consignee: e.target.value }))} />
              </Field>
              <Field label="State Code">
                <Input value={gst.state_code} onChange={e => setGst(p => ({ ...p, state_code: e.target.value }))} />
              </Field>
            </div>

            {/* Product Details */}
            <div style={{ fontSize: 13, fontWeight: 700, color: PRIMARY, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${BORDER}` }}>
              Items Being Invoiced {backorder && `(from Dispatch: ${backorder.back_order_number || ''})`}
            </div>
            <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${BORDER}`, marginBottom: 4 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Job Code", "Part No.", "Description", "HSN", "Qty (This Dispatch)", "Unit", "Unit Price", "Tax %", "Tax Amt", "Total"].map(h => (
                      <th key={h} style={{
                        background: PRIMARY, color: "#e2e8f0",
                        fontSize: 11, fontWeight: 600, padding: "11px 12px",
                        textAlign: ["Qty (This Dispatch)", "Unit Price", "Tax %", "Tax Amt", "Total"].includes(h) ? "right" : "left",
                        whiteSpace: "nowrap"
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "9px 12px", fontSize: 12.5 }}>{li.job_code || "—"}</td>
                      <td style={{ padding: "9px 12px", fontSize: 12.5, fontFamily: "monospace" }}>{li.part_no || "—"}</td>
                      <td style={{ padding: "9px 12px", fontSize: 12.5, maxWidth: 160 }}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {li.description}
                        </span>
                      </td>
                      <td style={{ padding: "9px 12px", fontSize: 12.5 }}>{li.hsn_code}</td>
                      <td style={{ padding: "6px 8px", textAlign: "right" }}>
                        <input
                          type="number" min={0}
                          value={li.quantity}
                          onChange={e => {
                            const qty = parseFloat(e.target.value) || 0
                            const excl = qty * parseFloat(li.unit_price || 0)
                            const taxAmt = Math.round(excl * (parseFloat(li.tax_percent || 0) / 100) * 100) / 100
                            const updated = [...lineItems]
                            updated[idx] = { ...li, quantity: qty, tax_amount: taxAmt, total: Math.round((excl + taxAmt) * 100) / 100 }
                            setLineItems(updated)
                          }}
                          style={{ width: 80, border: `1.5px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12.5, fontFamily: FONT, textAlign: "right" }}
                        />
                        {/* Show original dispatch quantity */}
                        <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                          (Max from dispatch: {li.original_quantity || li.quantity})
                        </div>
                      </td>
                      <td style={{ padding: "9px 12px", fontSize: 12.5, color: "#64748b" }}>{li.unit}</td>
                      <td style={{ padding: "9px 12px", fontSize: 12.5, textAlign: "right" }}>{fmtAmt(li.unit_price)}</td>
                      <td style={{ padding: "9px 12px", fontSize: 12.5, textAlign: "right", color: "#64748b" }}>{li.tax_percent}%</td>
                      <td style={{ padding: "9px 12px", fontSize: 12.5, textAlign: "right", color: "#64748b" }}>{fmtAmt(li.tax_amount)}</td>
                      <td style={{ padding: "9px 12px", fontSize: 12.5, fontWeight: 700, textAlign: "right", color: PRIMARY }}>{fmtAmt(li.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#f8fafc" }}>
                    <td colSpan={8} style={{ padding: "10px 12px", textAlign: "right", fontSize: 12, color: "#64748b", fontWeight: 600 }}>Net Amount:</td>
                    <td colSpan={2} style={{ padding: "10px 12px", fontWeight: 700, color: PRIMARY }}>{fmtAmt(totals.net)}</td>
                  </tr>
                  <tr style={{ background: "#f8fafc" }}>
                    <td colSpan={8} style={{ padding: "10px 12px", textAlign: "right", fontSize: 12, color: "#64748b", fontWeight: 600 }}>Tax Amount:</td>
                    <td colSpan={2} style={{ padding: "10px 12px", fontWeight: 700, color: "#64748b" }}>{fmtAmt(totals.tax)}</td>
                  </tr>
                  <tr style={{ background: PRIMARY }}>
                    <td colSpan={8} style={{ padding: "12px 12px", textAlign: "right", fontSize: 13, color: "#fff", fontWeight: 700 }}>Grand Total:</td>
                    <td colSpan={2} style={{ padding: "12px 12px", fontWeight: 700, color: "#fff", fontSize: 14 }}>{fmtAmt(totals.grand)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ── Step 3: Logistics Details ── */}
        {step === 3 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: PRIMARY, marginBottom: 20, paddingBottom: 10, borderBottom: `1px solid ${BORDER}` }}>
              Logistics Details
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
              <Field label="Date of Removal">
                <Input type="date" value={step3.date_of_removal} onChange={e => setStep3(p => ({ ...p, date_of_removal: e.target.value }))} />
              </Field>
              <Field label="Time of Removal">
                <Input type="time" value={step3.time_of_removal} onChange={e => setStep3(p => ({ ...p, time_of_removal: e.target.value }))} />
              </Field>
              <Field label="Invoice Type">
                <Select value={step3.invoice_type_logistics} onChange={e => setStep3(p => ({ ...p, invoice_type_logistics: e.target.value }))}>
                  <option value="">Select</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Excise">Excise</option>
                  <option value="Service">Service</option>
                  <option value="Trading">Trading</option>
                </Select>
              </Field>
              <Field label="Mode of Transport">
                <Select value={step3.mode_of_transport} onChange={e => setStep3(p => ({ ...p, mode_of_transport: e.target.value }))}>
                  <option value="">Select</option>
                  <option value="By Road">By Road</option>
                  <option value="By Air">By Air</option>
                  <option value="By Sea">By Sea</option>
                  <option value="By Rail">By Rail</option>
                </Select>
              </Field>
              <Field label="Transporter">
                <Input value={step3.transporter} onChange={e => setStep3(p => ({ ...p, transporter: e.target.value }))} />
              </Field>
              <Field label="Vehicle Number">
                <Input value={step3.vehicle_number} onChange={e => setStep3(p => ({ ...p, vehicle_number: e.target.value }))} />
              </Field>
              <Field label="LR Number">
                <Input value={step3.lr_number} onChange={e => setStep3(p => ({ ...p, lr_number: e.target.value }))} />
              </Field>
              <Field label="Payment Due Date">
                <Input type="date" value={step3.payment_due_date} onChange={e => setStep3(p => ({ ...p, payment_due_date: e.target.value }))} />
              </Field>
            </div>
          </div>
        )}
      </div>

      {/* Navigation footer */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 28px", borderTop: `1px solid ${BORDER}`, marginTop: 16
      }}>
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          style={{
            background: step === 1 ? "#f8fafc" : "#fff",
            color: step === 1 ? "#94a3b8" : PRIMARY,
            border: `1.5px solid ${step === 1 ? BORDER : PRIMARY}`,
            padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: step === 1 ? "not-allowed" : "pointer", fontFamily: FONT
          }}
        >
          ← Back
        </button>

        <div style={{ display: "flex", gap: 10 }}>
          {step < 3 ? (
            <button
              onClick={() => setStep(s => Math.min(3, s + 1))}
              style={{
                background: PRIMARY, color: "#fff", border: "none",
                padding: "10px 32px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: FONT
              }}
            >
              Next →
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: "#fff", color: PRIMARY,
                  border: `1.5px solid ${PRIMARY}`,
                  padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer", fontFamily: FONT,
                  opacity: saving ? .7 : 1
                }}
              >
                {saving ? "Saving…" : isNew ? "Save as Draft" : "Update Invoice"}
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                style={{
                  background: PRIMARY, color: "#fff", border: "none",
                  padding: "10px 28px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer", fontFamily: FONT,
                  opacity: saving ? .7 : 1,
                  boxShadow: "0 2px 10px rgba(18,44,65,.2)"
                }}
              >
                {saving ? "Confirming…" : "Confirm Invoice"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Packaging Slip Tab ─────────────────────────────────────────────────────────

function PackagingSlipTab({ invoice, step1, packagingData, setPackagingData, saving, onSave }) {
  const addItem = () => setPackagingData(p => ({
    ...p,
    items: [...p.items, {
      serial_number: p.items.length + 1,
      unit: "NOS", packaging_type: "", packaging_case_no: "",
      packaging_dimension: "", dimension_metric: "Inches",
      net_weight: "", gross_weight: "", description: ""
    }]
  }))

  const removeItem = idx => setPackagingData(p => ({
    ...p,
    items: p.items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, serial_number: i + 1 }))
  }))

  const updateItem = (idx, field, value) => setPackagingData(p => {
    const items = [...p.items]
    items[idx] = { ...items[idx], [field]: value }
    return { ...p, items }
  })

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${BORDER}`, padding: 24, marginTop: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 24 }}>
        <Field label="Packing List No.">
          <Input readOnly value={invoice?.packaging_slip?.packing_list_number || "Auto-generated"} />
        </Field>
        <Field label="No. of Packages">
          <Input type="number" value={packagingData.no_of_packages}
            onChange={e => setPackagingData(p => ({ ...p, no_of_packages: parseInt(e.target.value) || 0 }))} />
        </Field>
        <Field label="Invoice Number">
          <Input readOnly value={invoice?.invoice_number || "—"} />
        </Field>
        <Field label="PO Number">
          <Input readOnly value={step1.po_number || "—"} />
        </Field>
        <Field label="Consignee Name">
          <Input value={packagingData.consignee_name}
            onChange={e => setPackagingData(p => ({ ...p, consignee_name: e.target.value }))} />
        </Field>
      </div>
      <Field label="Consignee Address" style={{ marginBottom: 24 }}>
        <Textarea value={packagingData.consignee_address}
          onChange={e => setPackagingData(p => ({ ...p, consignee_address: e.target.value }))} />
      </Field>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>Packaging Items</span>
        <button onClick={addItem} style={{
          background: PRIMARY, color: "#fff", border: "none",
          padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer"
        }}>+ Add Package</button>
      </div>

      {packagingData.items.map((item, idx) => (
        <div key={idx} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 18, marginBottom: 14, position: "relative" }}>
          <button onClick={() => removeItem(idx)} style={{
            position: "absolute", top: 12, right: 12,
            background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 17, lineHeight: 1
          }}>✕</button>
          <div style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, marginBottom: 14 }}>Package {idx + 1}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {[["Unit", "unit"], ["Net Weight", "net_weight"], ["Gross Weight", "gross_weight"],
              ["Packaging Type", "packaging_type"], ["Case No.", "packaging_case_no"],
              ["Dimension", "packaging_dimension"], ["Description", "description"]].map(([lbl, fld]) => (
              <Field key={fld} label={lbl}>
                <Input value={item[fld] ?? ""} onChange={e => updateItem(idx, fld, e.target.value)} />
              </Field>
            ))}
            <Field label="Metric">
              <Select value={item.dimension_metric} onChange={e => updateItem(idx, "dimension_metric", e.target.value)}>
                <option value="Inches">Inches</option>
                <option value="Cm">Cm</option>
                <option value="M">M</option>
              </Select>
            </Field>
          </div>
        </div>
      ))}

      {packagingData.items.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", border: `1px dashed ${BORDER}`, borderRadius: 8, fontSize: 13 }}>
          No packaging items. Click "+ Add Package" to add.
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <button onClick={onSave} disabled={saving} style={{
          background: PRIMARY, color: "#fff", border: "none",
          padding: "10px 28px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer"
        }}>
          {saving ? "Saving…" : "Save Packaging Slip"}
        </button>
      </div>
    </div>
  )
}

// ── Delivery Challan Tab ───────────────────────────────────────────────────────

function DeliveryChallanTab({ invoice, billTo, shipTo, challanData, setChallanData, saving, onSave }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${BORDER}`, padding: 24, marginTop: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
        <Field label="Invoice Number">
          <Input readOnly value={invoice?.invoice_number || "—"} />
        </Field>
        <Field label="Challan Number">
          <Input readOnly value={invoice?.delivery_challan?.challan_number || "Auto-generated"} />
        </Field>
        <Field label="Challan Date">
          <Input type="date" value={challanData.challan_date}
            onChange={e => setChallanData(p => ({ ...p, challan_date: e.target.value }))} />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {[billTo, shipTo].map((snap, idx) => snap ? (
          <div key={idx} style={{
            padding: 16, background: "#f8fafc", borderRadius: 10, border: `1px solid ${BORDER}`
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".04em" }}>
              {idx === 0 ? "Bill To" : "Ship To"}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{snap.entity_name || "—"}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{snap.address_line || "—"}</div>
          </div>
        ) : null)}
      </div>

      <Field label="Remark" style={{ marginBottom: 20 }}>
        <Textarea value={challanData.remark}
          onChange={e => setChallanData(p => ({ ...p, remark: e.target.value }))} />
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onSave} disabled={saving} style={{
          background: PRIMARY, color: "#fff", border: "none",
          padding: "10px 28px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer"
        }}>
          {saving ? "Saving…" : "Save Delivery Challan"}
        </button>
      </div>
    </div>
  )
}

// ── E-Way Bill Tab ─────────────────────────────────────────────────────────────

function EWayBillTab() {
  return (
    <div style={{
      background: "#fff", borderRadius: 12, border: `1px solid ${BORDER}`,
      padding: 48, textAlign: "center", marginTop: 24
    }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>E-Way Bill</div>
      <div style={{ fontSize: 13, color: "#94a3b8" }}>E-Way bill generation coming soon.</div>
    </div>
  )
}

// ── Main CreateInvoice Component ───────────────────────────────────────────────

export default function CreateInvoice({ role = "manager" }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const backorderId = searchParams.get("back_order_id")

  const [activeTab, setActiveTab] = useState("invoicing")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [invoice, setInvoice] = useState(null)
  const [order, setOrder] = useState(null)
  const [backorder, setBackorder] = useState(null)
  const [oaLineItems, setOaLineItems] = useState([])

  // Form state
  const [step, setStep] = useState(1)
  const [step1, setStep1] = useState({
    po_number: "", po_date: "",
    invoice_number: "", invoice_date: new Date().toISOString().split('T')[0],
    amd_number: "", amd_date: "",
    location: "", invoice_type: "",
  })
  const [billTo, setBillTo] = useState(null)
  const [shipTo, setShipTo] = useState(null)
  const [contact, setContact] = useState({ name: "", number: "", email: "" })
  const [gst, setGst] = useState({ consignee: "", consignor: "", state_code: "" })
  const [lineItems, setLineItems] = useState([])
  const [step3, setStep3] = useState({
    date_of_removal: "", time_of_removal: "",
    invoice_type_logistics: "", mode_of_transport: "",
    transporter: "", vehicle_number: "", lr_number: "", payment_due_date: "",
  })
  const [packagingData, setPackagingData] = useState({ no_of_packages: 0, consignee_name: "", consignee_address: "", items: [] })
  const [challanData, setChallanData] = useState({ challan_date: new Date().toISOString().split('T')[0], remark: "" })

  const isNew = !id && !!backorderId

  const calcItems = items => items.map(item => {
    const excl = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)
    const taxAmt = Math.round(excl * ((parseFloat(item.tax_percent) || 0) / 100) * 100) / 100
    return { ...item, tax_amount: taxAmt, total: Math.round((excl + taxAmt) * 100) / 100 }
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      if (backorderId) {
        // New invoice from backorder
        const prefillRes = await api.get(`/logistics/invoices/prefill-from-backorder/${backorderId}/`)
        const prefill = prefillRes.data

        // Set backorder info
        setBackorder({ 
          id: prefill.backorder_id,  // Note: backorder_id from API
          back_order_number: prefill.backorder_number, 
          order: prefill.order_id 
        })

        const orderRes = await api.get(`/orders/orders/${prefill.order_id}/`)
        setOrder(orderRes.data)
        setOaLineItems(orderRes.data.oa_line_items || [])

        const items = prefill.line_items.map(item => ({
          oa_line_item_id: item.oa_line_item_id,
          job_code: item.job_code || "",
          customer_part_no: item.customer_part_no || "",
          part_no: item.part_no || "",
          description: item.description || "",
          hsn_code: item.hsn_code || "",
          quantity: item.quantity,  // This is from backorder (dispatch quantity)
          original_quantity: item.quantity,  // Store original for reference
          unit: item.unit || "NOS",
          unit_price: item.unit_price,
          tax_group_code: item.tax_group_code || "",
          tax_percent: item.tax_percent || 0,
          tax_amount: 0, total: 0,
        }))
        setLineItems(calcItems(items))
        setBillTo(prefill.bill_to)
        setShipTo(prefill.ship_to)
        setContact(prefill.contact || { name: "", number: "", email: "" })
        setGst(prefill.gst || { consignee: "", consignor: "", state_code: "" })
        setStep1(p => ({
          ...p,
          po_number: prefill.po_number || "",
          location: prefill.transport_details?.division || "",
        }))
        setStep3(p => ({
          ...p,
          mode_of_transport: prefill.transport_details?.mode_of_transport || "By Road",
        }))

      } else if (id) {
        // Edit existing invoice
        const invRes = await api.get(`/logistics/invoices/${id}/`)
        const inv = invRes.data
        setInvoice(inv)

        const orderRes = await api.get(`/orders/orders/${inv.order}/`)
        setOrder(orderRes.data)
        setOaLineItems(orderRes.data.oa_line_items || [])
        setLineItems(inv.line_items || [])

        setStep1({
          po_number: inv.po_number || "",
          po_date: inv.po_date || "",
          invoice_number: inv.invoice_number || "",
          invoice_date: inv.invoice_date || new Date().toISOString().split('T')[0],
          amd_number: inv.amd_number || "",
          amd_date: inv.amd_date || "",
          location: inv.location || "",
          invoice_type: inv.invoice_type || "",
        })
        setBillTo(inv.bill_to || null)
        setShipTo(inv.ship_to || null)
        setContact({ name: inv.contact_name || "", number: inv.contact_number || "", email: inv.contact_email || "" })
        setGst({ consignee: inv.consignee_gst || "", consignor: inv.consignor_gst || "", state_code: inv.state_code || "" })
        setStep3({
          date_of_removal: inv.date_of_removal || "",
          time_of_removal: inv.time_of_removal || "",
          invoice_type_logistics: inv.invoice_type || "",
          mode_of_transport: inv.mode_of_transport || "",
          transporter: inv.transporter || "",
          vehicle_number: inv.vehicle_number || "",
          lr_number: inv.lr_number || "",
          payment_due_date: inv.payment_due_date || "",
        })
        if (inv.packaging_slip) {
          const ps = inv.packaging_slip
          setPackagingData({ no_of_packages: ps.no_of_packages || 0, consignee_name: ps.consignee_name || "", consignee_address: ps.consignee_address || "", items: ps.items || [] })
        }
        if (inv.delivery_challan) {
          setChallanData({ challan_date: inv.delivery_challan.challan_date || new Date().toISOString().split('T')[0], remark: inv.delivery_challan.remark || "" })
        }
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || "Failed to load data.")
    } finally {
      setLoading(false)
    }
  }, [id, backorderId])

  useEffect(() => { fetchData() }, [fetchData])

  const totals = lineItems.reduce((acc, item) => {
    const excl = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)
    const tax = excl * ((parseFloat(item.tax_percent) || 0) / 100)
    return { net: acc.net + excl, tax: acc.tax + tax, grand: acc.grand + excl + tax }
  }, { net: 0, tax: 0, grand: 0 })

  const buildPayload = () => ({
    order: order?.id || invoice?.order,  // ← required FK — was missing, caused 400
    po_number: step1.po_number,
    po_date: step1.po_date || null,
    invoice_date: step1.invoice_date,
    amd_number: step1.amd_number,
    amd_date: step1.amd_date || null,
    location: step1.location,
    invoice_type: step1.invoice_type,
    bill_to: billTo,
    ship_to: shipTo,
    contact_name: contact.name,
    contact_number: contact.number,
    contact_email: contact.email,
    consignee_gst: gst.consignee,
    consignor_gst: gst.consignor,
    state_code: gst.state_code,
    date_of_removal: step3.date_of_removal || null,
    time_of_removal: step3.time_of_removal || null,
    mode_of_transport: step3.mode_of_transport,
    transporter: step3.transporter,
    vehicle_number: step3.vehicle_number,
    lr_number: step3.lr_number,
    payment_due_date: step3.payment_due_date || null,
    line_items: lineItems.map(({ oa_line_item_id, ...rest }) => ({
      ...rest,
    oa_line_item: oa_line_item_id,  // Make sure backend gets oa_line_item
    })),
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      if (id) {
        // UPDATE existing invoice - this is correct
        await api.put(`/logistics/invoices/${id}/`, buildPayload())
        alert("Invoice updated successfully!")
        navigate(`/${role}/logistics/invoices/${id}`)
      } else if (backorderId) {
        // CREATE new invoice - MUST use create_from_backorder endpoint
        const res = await api.post('/logistics/invoices/create_from_backorder/', {
          backorder_id: backorderId,  // NOTE: field name is 'backorder_id' not 'backorderId'
          ...buildPayload(),
        })
        const invId = res.data.invoice?.id || res.data.id
        alert(`Invoice created successfully!`)
        navigate(`/${role}/logistics/invoices/${invId}`)
      }
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || err.response?.data?.error || "Failed to save invoice.")
    } finally {
      setSaving(false)
    }
  }


  const handleConfirm = async () => {
    const invoiceId = id || invoice?.id
    
    // If no invoice exists yet, create it first
    if (!invoiceId && backorderId) {
      setSaving(true)
      try {
        // Step 1: Create the invoice first
        const createRes = await api.post('/logistics/invoices/create_from_backorder/', {
          backorder_id: backorderId,
          ...buildPayload(),
        })
        const newInvoiceId = createRes.data.invoice?.id || createRes.data.id
        
        // Step 2: Confirm the newly created invoice
        await api.post(`/logistics/invoices/${newInvoiceId}/confirm/`)
        
        alert("Invoice created and confirmed successfully!")
        navigate(`/${role}/logistics/invoices/${newInvoiceId}`)
      } catch (err) {
        console.error(err)
        alert(err.response?.data?.message || err.response?.data?.error || "Failed to create/confirm invoice.")
      } finally {
        setSaving(false)
      }
      return
    }
    
    // If invoice exists, just confirm it
    if (invoiceId) {
      setSaving(true)
      try {
        // First save any pending changes
        if (id) {
          await api.put(`/logistics/invoices/${id}/`, buildPayload())
        }
        // Then confirm
        await api.post(`/logistics/invoices/${invoiceId}/confirm/`)
        alert("Invoice confirmed!")
        navigate(`/${role}/logistics/invoices/${invoiceId}`)
      } catch (err) {
        console.error(err)
        alert(err.response?.data?.message || "Failed to confirm invoice.")
      } finally {
        setSaving(false)
      }
    } else {
      alert("No invoice found to confirm.")
    }
  }

  const handleSavePackaging = async () => {
    const invoiceId = id || invoice?.id
    if (!invoiceId) { alert("Please save the invoice first."); return }
    setSaving(true)
    try {
      if (invoice?.packaging_slip?.id) {
        await api.put(`/logistics/packaging-slips/${invoice.packaging_slip.id}/`, { invoice: invoiceId, ...packagingData })
      } else {
        await api.post('/logistics/packaging-slips/', { invoice: invoiceId, ...packagingData })
      }
      alert("Packaging slip saved!")
      fetchData()
    } catch (err) {
      alert("Failed to save packaging slip.")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveChallan = async () => {
    const invoiceId = id || invoice?.id
    if (!invoiceId) { alert("Please save the invoice first."); return }
    setSaving(true)
    try {
      if (invoice?.delivery_challan?.id) {
        await api.put(`/logistics/delivery-challans/${invoice.delivery_challan.id}/`, { invoice: invoiceId, ...challanData, bill_to: billTo, ship_to: shipTo })
      } else {
        await api.post('/logistics/delivery-challans/', { invoice: invoiceId, ...challanData, bill_to: billTo, ship_to: shipTo })
      }
      alert("Delivery challan saved!")
      fetchData()
    } catch (err) {
      alert("Failed to save delivery challan.")
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { key: "order", label: "Order Details" },
    { key: "invoicing", label: "Invoicing" },
    { key: "packaging", label: "Packaging Slip" },
    { key: "challan", label: "Delivery Challan" },
    { key: "ebill", label: "E-Way Bill" },
  ]

  if (loading) return (
    <div style={{ fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 12, color: "#94a3b8" }}>
      <div style={{ width: 20, height: 20, border: `2px solid ${BORDER}`, borderTopColor: PRIMARY, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      Loading…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{ fontFamily: FONT, padding: 40, textAlign: "center" }}>
      <div style={{ color: "#dc2626", marginBottom: 16 }}>{error}</div>
      <button onClick={() => navigate(-1)} style={{ background: PRIMARY, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer" }}>Go Back</button>
    </div>
  )

  return (
    <div style={{ fontFamily: FONT, background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: PRIMARY, padding: "22px 32px", boxShadow: "0 2px 8px rgba(0,0,0,.12)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, color: "rgba(255,255,255,.5)", textTransform: "uppercase", marginBottom: 5 }}>
              Logistics — Outbound Fulfilment
            </div>
            <h1 style={{ color: "#fff", fontSize: 22, margin: 0, fontWeight: 700 }}>
              {id ? "Edit Invoice" : "Create Invoice from Dispatch"}
            </h1>
            {(order?.order_number || invoice?.order_number) && (
              <div style={{ color: "rgba(255,255,255,.65)", marginTop: 6, fontSize: 13 }}>
                Order: {order?.order_number || invoice?.order_number}
                {backorder && ` · Dispatch: ${backorder.back_order_number}`}
              </div>
            )}
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "rgba(255,255,255,.12)", color: "#fff",
              border: "1.5px solid rgba(255,255,255,.3)",
              padding: "9px 20px", borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${BORDER}`, padding: "0 32px", display: "flex", gap: 0 }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "14px 20px", background: "transparent", border: "none",
              borderBottom: activeTab === tab.key ? `2.5px solid ${PRIMARY}` : "2.5px solid transparent",
              color: activeTab === tab.key ? PRIMARY : "#64748b",
              fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500,
              cursor: "pointer", fontFamily: FONT, marginBottom: -1,
              transition: "all .15s"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "0 32px 48px" }}>
        {activeTab === "order" && <OrderDetailTab oaLineItems={oaLineItems} />}

        {activeTab === "invoicing" && (
          <>
            <OrderDetailTab oaLineItems={oaLineItems} />
            <InvoicingTab
              step={step} setStep={setStep}
              step1={step1} setStep1={setStep1}
              billTo={billTo} setBillTo={setBillTo}
              shipTo={shipTo} setShipTo={setShipTo}
              contact={contact} setContact={setContact}
              gst={gst} setGst={setGst}
              lineItems={lineItems} setLineItems={setLineItems}
              step3={step3} setStep3={setStep3}
              totals={totals}
              invoice={invoice}
              saving={saving}
              handleSave={handleSave}
              handleConfirm={handleConfirm}
              isNew={isNew}
              backorder={backorder}  // ← ADD THIS LINE
            />
          </>
        )}

        {activeTab === "packaging" && (
          <PackagingSlipTab
            invoice={invoice} step1={step1}
            packagingData={packagingData} setPackagingData={setPackagingData}
            saving={saving} onSave={handleSavePackaging}
          />
        )}

        {activeTab === "challan" && (
          <DeliveryChallanTab
            invoice={invoice} billTo={billTo} shipTo={shipTo}
            challanData={challanData} setChallanData={setChallanData}
            saving={saving} onSave={handleSaveChallan}
          />
        )}

        {activeTab === "ebill" && <EWayBillTab />}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}