// components/shared/logistics/EditInvoiceModal.jsx
// Enhanced version with Packaging Slip and Delivery Challan editing
import { useState, useEffect } from 'react'
import api from '../api/axios'

const PRIMARY = "#122C41"
const BORDER  = "#e2e8f0"
const FONT    = "'Inter', 'Segoe UI', sans-serif"

// ── Shared UI Components ─────────────────────────────────────────────────────

function Field({ label, children, style }) {
  return (
    <div style={{ position: "relative", ...style }}>
      <span style={{
        position: "absolute", top: -9, left: 12, background: "#fff",
        padding: "0 4px", fontSize: 11, color: "#64748b", fontWeight: 600,
        pointerEvents: "none", zIndex: 1, whiteSpace: "nowrap"
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
        borderRadius: 8, padding: "10px 13px",
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
        border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: "10px 13px",
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
        border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: "10px 13px",
        fontSize: 13, fontFamily: FONT, width: "100%",
        background: "#fff", color: "#1e293b",
        outline: "none", boxSizing: "border-box", cursor: "pointer",
        ...style
      }}
    >
      {children}
    </select>
  )
}

// ── Tab: Invoice Details ─────────────────────────────────────────────────────

function InvoiceDetailsTab({ form, setForm }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      <Field label="PO Number">
        <Input value={form.po_number} onChange={e => setForm(p => ({ ...p, po_number: e.target.value }))} />
      </Field>
      <Field label="PO Date">
        <Input type="date" value={form.po_date} onChange={e => setForm(p => ({ ...p, po_date: e.target.value }))} />
      </Field>
      <Field label="Invoice Number">
        <Input readOnly value={form.invoice_number || "(auto)"} />
      </Field>
      <Field label="Invoice Date">
        <Input type="date" value={form.invoice_date} onChange={e => setForm(p => ({ ...p, invoice_date: e.target.value }))} />
      </Field>
      <Field label="AMD Number">
        <Input value={form.amd_number} onChange={e => setForm(p => ({ ...p, amd_number: e.target.value }))} />
      </Field>
      <Field label="AMD Date">
        <Input type="date" value={form.amd_date} onChange={e => setForm(p => ({ ...p, amd_date: e.target.value }))} />
      </Field>
      <Field label="Location / Division">
        <Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
      </Field>
      <Field label="Invoice Type">
        <Select value={form.invoice_type} onChange={e => setForm(p => ({ ...p, invoice_type: e.target.value }))}>
          <option value="">Select Type</option>
          <option value="Manufacturing">Manufacturing</option>
          <option value="Excise">Excise</option>
          <option value="Service">Service</option>
          <option value="Trading">Trading</option>
        </Select>
      </Field>
    </div>
  )
}

// ── Tab: Address & Contact ───────────────────────────────────────────────────

function AddressContactTab({ form, setForm }) {
  const updateBillTo = patch => setForm(p => ({ ...p, bill_to: { ...p.bill_to, ...patch } }))
  const updateShipTo = patch => setForm(p => ({ ...p, ship_to: { ...p.ship_to, ...patch } }))

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 24 }}>
        {/* Bill To */}
        <div style={{ border: `1.5px solid #3b82f620`, borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #3b82f620" }}>
            Bill To
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Entity Name">
              <Input value={form.bill_to?.entity_name} onChange={e => updateBillTo({ entity_name: e.target.value })} />
            </Field>
            <Field label="Address">
              <Textarea value={form.bill_to?.address_line} onChange={e => updateBillTo({ address_line: e.target.value })} rows={2} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="City"><Input value={form.bill_to?.city} onChange={e => updateBillTo({ city: e.target.value })} /></Field>
              <Field label="State"><Input value={form.bill_to?.state} onChange={e => updateBillTo({ state: e.target.value })} /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Pincode"><Input value={form.bill_to?.pincode} onChange={e => updateBillTo({ pincode: e.target.value })} /></Field>
              <Field label="Country"><Input value={form.bill_to?.country} onChange={e => updateBillTo({ country: e.target.value })} /></Field>
            </div>
          </div>
        </div>

        {/* Ship To */}
        <div style={{ border: `1.5px solid #f59e0b20`, borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #f59e0b20" }}>
            Ship To
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Entity Name">
              <Input value={form.ship_to?.entity_name} onChange={e => updateShipTo({ entity_name: e.target.value })} />
            </Field>
            <Field label="Address">
              <Textarea value={form.ship_to?.address_line} onChange={e => updateShipTo({ address_line: e.target.value })} rows={2} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="City"><Input value={form.ship_to?.city} onChange={e => updateShipTo({ city: e.target.value })} /></Field>
              <Field label="State"><Input value={form.ship_to?.state} onChange={e => updateShipTo({ state: e.target.value })} /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Pincode"><Input value={form.ship_to?.pincode} onChange={e => updateShipTo({ pincode: e.target.value })} /></Field>
              <Field label="Country"><Input value={form.ship_to?.country} onChange={e => updateShipTo({ country: e.target.value })} /></Field>
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div style={{ fontSize: 12.5, fontWeight: 700, color: PRIMARY, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>
        Contact Person
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginBottom: 22 }}>
        <Field label="Name">
          <Input value={form.contact_name} onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))} />
        </Field>
        <Field label="Number">
          <Input value={form.contact_number} onChange={e => setForm(p => ({ ...p, contact_number: e.target.value }))} />
        </Field>
        <Field label="Email">
          <Input value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} />
        </Field>
      </div>

      {/* GST */}
      <div style={{ fontSize: 12.5, fontWeight: 700, color: PRIMARY, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>
        GST Details
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        <Field label="Consignor GST">
          <Input value={form.consignor_gst} onChange={e => setForm(p => ({ ...p, consignor_gst: e.target.value }))} />
        </Field>
        <Field label="Consignee GST">
          <Input value={form.consignee_gst} onChange={e => setForm(p => ({ ...p, consignee_gst: e.target.value }))} />
        </Field>
        <Field label="State Code">
          <Input value={form.state_code} onChange={e => setForm(p => ({ ...p, state_code: e.target.value }))} />
        </Field>
      </div>
    </div>
  )
}

// ── Tab: Logistics ───────────────────────────────────────────────────────────

function LogisticsTab({ form, setForm }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      <Field label="Date of Removal">
        <Input type="date" value={form.date_of_removal} onChange={e => setForm(p => ({ ...p, date_of_removal: e.target.value }))} />
      </Field>
      <Field label="Time of Removal">
        <Input type="time" value={form.time_of_removal} onChange={e => setForm(p => ({ ...p, time_of_removal: e.target.value }))} />
      </Field>
      <Field label="Mode of Transport">
        <Select value={form.mode_of_transport} onChange={e => setForm(p => ({ ...p, mode_of_transport: e.target.value }))}>
          <option value="">Select</option>
          <option value="By Road">By Road</option>
          <option value="By Air">By Air</option>
          <option value="By Sea">By Sea</option>
          <option value="By Rail">By Rail</option>
        </Select>
      </Field>
      <Field label="Transporter">
        <Input value={form.transporter} onChange={e => setForm(p => ({ ...p, transporter: e.target.value }))} />
      </Field>
      <Field label="Vehicle Number">
        <Input value={form.vehicle_number} onChange={e => setForm(p => ({ ...p, vehicle_number: e.target.value }))} />
      </Field>
      <Field label="LR Number">
        <Input value={form.lr_number} onChange={e => setForm(p => ({ ...p, lr_number: e.target.value }))} />
      </Field>
      <Field label="Payment Due Date">
        <Input type="date" value={form.payment_due_date} onChange={e => setForm(p => ({ ...p, payment_due_date: e.target.value }))} />
      </Field>
    </div>
  )
}

// ── Tab: Packaging Slip ───────────────────────────────────────────────────────

function PackagingSlipTab({ packagingData, setPackagingData, invoiceNumber }) {
  const addItem = () => setPackagingData(p => ({
    ...p,
    items: [...p.items, {
      serial_number: p.items.length + 1,
      unit: "NOS",
      packaging_type: "",
      packaging_case_no: "",
      packaging_dimension: "",
      dimension_metric: "Inches",
      net_weight: "",
      gross_weight: "",
      description: ""
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
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18, marginBottom: 24 }}>
        <Field label="Packing List No.">
          <Input readOnly value={packagingData.packing_list_number || "Auto-generated"} />
        </Field>
        <Field label="No. of Packages">
          <Input 
            type="number" 
            value={packagingData.no_of_packages} 
            onChange={e => setPackagingData(p => ({ ...p, no_of_packages: parseInt(e.target.value) || 0 }))} 
          />
        </Field>
        <Field label="Invoice Number">
          <Input readOnly value={invoiceNumber || "—"} />
        </Field>
        <Field label="Consignee Name">
          <Input 
            value={packagingData.consignee_name} 
            onChange={e => setPackagingData(p => ({ ...p, consignee_name: e.target.value }))} 
            placeholder="Name of consignee"
          />
        </Field>
      </div>

      <Field label="Consignee Address" style={{ marginBottom: 24 }}>
        <Textarea 
          value={packagingData.consignee_address} 
          onChange={e => setPackagingData(p => ({ ...p, consignee_address: e.target.value }))} 
          rows={2}
          placeholder="Full address of consignee"
        />
      </Field>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>Packaging Items</span>
        <button 
          onClick={addItem} 
          style={{
            background: PRIMARY, color: "#fff", border: "none",
            padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6
          }}
        >
          <span style={{ fontSize: 16 }}>+</span> Add Package
        </button>
      </div>

      <div style={{ maxHeight: 400, overflowY: "auto", paddingRight: 8 }}>
        {packagingData.items.map((item, idx) => (
          <div key={idx} style={{ 
            border: `1px solid ${BORDER}`, borderRadius: 10, padding: 18, 
            marginBottom: 14, position: "relative", background: "#fafafa"
          }}>
            <button 
              onClick={() => removeItem(idx)} 
              style={{
                position: "absolute", top: 12, right: 12,
                background: "#fee2e2", border: "none", borderRadius: 20,
                cursor: "pointer", color: "#dc2626", fontSize: 14,
                padding: "4px 10px", fontWeight: 600
              }}
            >
              ✕ Remove
            </button>
            <div style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, marginBottom: 14 }}>
              Package #{idx + 1}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <Field label="Unit">
                <Select value={item.unit} onChange={e => updateItem(idx, "unit", e.target.value)}>
                  <option value="NOS">NOS</option>
                  <option value="PCS">PCS</option>
                  <option value="KG">KG</option>
                  <option value="MTR">MTR</option>
                </Select>
              </Field>
              <Field label="Packaging Type">
                <Input value={item.packaging_type} onChange={e => updateItem(idx, "packaging_type", e.target.value)} placeholder="Box/Crate/Pallet" />
              </Field>
              <Field label="Case No.">
                <Input value={item.packaging_case_no} onChange={e => updateItem(idx, "packaging_case_no", e.target.value)} placeholder="Case reference" />
              </Field>
              <Field label="Dimension">
                <Input value={item.packaging_dimension} onChange={e => updateItem(idx, "packaging_dimension", e.target.value)} placeholder="e.g., 30x20x10" />
              </Field>
              <Field label="Metric">
                <Select value={item.dimension_metric} onChange={e => updateItem(idx, "dimension_metric", e.target.value)}>
                  <option value="Inches">Inches</option>
                  <option value="Cm">Cm</option>
                  <option value="M">M</option>
                </Select>
              </Field>
              <Field label="Description">
                <Input value={item.description} onChange={e => updateItem(idx, "description", e.target.value)} placeholder="Item description" />
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
              <Field label="Net Weight">
                <Input 
                  type="number" 
                  value={item.net_weight} 
                  onChange={e => updateItem(idx, "net_weight", e.target.value)} 
                  placeholder="Weight"
                />
              </Field>
              <Field label="Gross Weight">
                <Input 
                  type="number" 
                  value={item.gross_weight} 
                  onChange={e => updateItem(idx, "gross_weight", e.target.value)} 
                  placeholder="Weight"
                />
              </Field>
            </div>
          </div>
        ))}
      </div>

      {packagingData.items.length === 0 && (
        <div style={{ 
          textAlign: "center", padding: 48, color: "#94a3b8", 
          border: `1px dashed ${BORDER}`, borderRadius: 8, fontSize: 13,
          background: "#fafafa"
        }}>
          No packaging items. Click "+ Add Package" to add.
        </div>
      )}
    </div>
  )
}

// ── Tab: Delivery Challan ─────────────────────────────────────────────────────

function DeliveryChallanTab({ challanData, setChallanData, invoiceNumber, billTo, shipTo }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginBottom: 24 }}>
        <Field label="Invoice Number">
          <Input readOnly value={invoiceNumber || "—"} />
        </Field>
        <Field label="Challan Number">
          <Input readOnly value={challanData.challan_number || "Auto-generated"} />
        </Field>
        <Field label="Challan Date">
          <Input 
            type="date" 
            value={challanData.challan_date} 
            onChange={e => setChallanData(p => ({ ...p, challan_date: e.target.value }))} 
          />
        </Field>
      </div>

      {/* Address Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 24 }}>
        <div style={{ padding: 14, background: "#f0f9ff", borderRadius: 10, border: "1px solid #bae6fd" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#0369a1", marginBottom: 8, textTransform: "uppercase" }}>
            Bill To
          </div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{billTo?.entity_name || "—"}</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{billTo?.address_line || "—"}</div>
          <div style={{ fontSize: 12, color: "#475569" }}>
            {billTo?.city && `${billTo.city}, `}{billTo?.state && `${billTo.state} - `}{billTo?.pincode || ""}
          </div>
        </div>
        <div style={{ padding: 14, background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#b45309", marginBottom: 8, textTransform: "uppercase" }}>
            Ship To
          </div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{shipTo?.entity_name || "—"}</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{shipTo?.address_line || "—"}</div>
          <div style={{ fontSize: 12, color: "#475569" }}>
            {shipTo?.city && `${shipTo.city}, `}{shipTo?.state && `${shipTo.state} - `}{shipTo?.pincode || ""}
          </div>
        </div>
      </div>

      <Field label="Remark / Notes" style={{ marginBottom: 20 }}>
        <Textarea 
          value={challanData.remark} 
          onChange={e => setChallanData(p => ({ ...p, remark: e.target.value }))} 
          rows={3}
          placeholder="Any special instructions or remarks for delivery..."
        />
      </Field>
    </div>
  )
}

// ── Main Modal Component ─────────────────────────────────────────────────────

export default function EditInvoiceModal({ invoice, onClose, onSaved, role = "manager" }) {
  const [activeTab, setActiveTab] = useState("details")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form state
  const [form, setForm] = useState({
    po_number:      invoice.po_number      || "",
    po_date:        invoice.po_date        || "",
    invoice_number: invoice.invoice_number || "",
    invoice_date:   invoice.invoice_date   || new Date().toISOString().split('T')[0],
    amd_number:     invoice.amd_number     || "",
    amd_date:       invoice.amd_date       || "",
    location:       invoice.location       || "",
    invoice_type:   invoice.invoice_type   || "",
    bill_to:        invoice.bill_to        || {},
    ship_to:        invoice.ship_to        || {},
    contact_name:   invoice.contact_name   || "",
    contact_number: invoice.contact_number || "",
    contact_email:  invoice.contact_email  || "",
    consignee_gst:  invoice.consignee_gst  || "",
    consignor_gst:  invoice.consignor_gst  || "",
    state_code:     invoice.state_code     || "",
    date_of_removal:     invoice.date_of_removal     || "",
    time_of_removal:     invoice.time_of_removal     || "",
    mode_of_transport:   invoice.mode_of_transport   || "",
    transporter:         invoice.transporter         || "",
    vehicle_number:      invoice.vehicle_number      || "",
    lr_number:           invoice.lr_number           || "",
    payment_due_date:    invoice.payment_due_date    || "",
  })

  // Packaging Slip state
  const [packagingData, setPackagingData] = useState({
    packing_list_number: invoice.packaging_slip?.packing_list_number || "",
    no_of_packages: invoice.packaging_slip?.no_of_packages || 0,
    consignee_name: invoice.packaging_slip?.consignee_name || "",
    consignee_address: invoice.packaging_slip?.consignee_address || "",
    items: invoice.packaging_slip?.items || []
  })

  // Delivery Challan state
  const [challanData, setChallanData] = useState({
    challan_number: invoice.delivery_challan?.challan_number || "",
    challan_date: invoice.delivery_challan?.challan_date || new Date().toISOString().split('T')[0],
    remark: invoice.delivery_challan?.remark || ""
  })

  // Check if invoice is confirmed (read-only for some fields)
  const isConfirmed = invoice.status === 'CONFIRMED'
  const isCancelled = invoice.status === 'CANCELLED'
  const isReadOnly = isConfirmed || isCancelled

  const tabs = [
    { key: "details", label: "📄 Invoice Details", icon: "📄" },
    { key: "address", label: "📍 Address & Contact", icon: "📍" },
    { key: "logistics", label: "🚚 Logistics", icon: "🚚" },
    { key: "packaging", label: "📦 Packaging Slip", icon: "📦" },
    { key: "challan", label: "📋 Delivery Challan", icon: "📋" },
  ]

  // Save main invoice details
  const handleSaveInvoice = async () => {
    setSaving(true)
    try {
      await api.put(`/logistics/invoices/${invoice.id}/`, {
        ...form,
        po_date: form.po_date || null,
        amd_date: form.amd_date || null,
        date_of_removal: form.date_of_removal || null,
        time_of_removal: form.time_of_removal || null,
        payment_due_date: form.payment_due_date || null,
        line_items: invoice.line_items || [],
      })
      onSaved?.()
      onClose()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || err.response?.data?.error || "Failed to update invoice.")
    } finally {
      setSaving(false)
    }
  }

  // Save packaging slip independently
  const handleSavePackaging = async () => {
    setSaving(true)
    try {
      const payload = {
        invoice: invoice.id,
        no_of_packages: packagingData.no_of_packages,
        consignee_name: packagingData.consignee_name,
        consignee_address: packagingData.consignee_address,
        items: packagingData.items.map((item, idx) => ({
          ...item,
          serial_number: idx + 1,
          packing_list_number: packagingData.packing_list_number
        }))
      }

      if (invoice.packaging_slip?.id) {
        await api.put(`/logistics/packaging-slips/${invoice.packaging_slip.id}/`, payload)
      } else {
        await api.post('/logistics/packaging-slips/', payload)
      }
      alert("Packaging slip saved successfully!")
      onSaved?.()
      onClose()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || "Failed to save packaging slip.")
    } finally {
      setSaving(false)
    }
  }

  // Save delivery challan independently
  const handleSaveChallan = async () => {
    setSaving(true)
    try {
      const payload = {
        invoice: invoice.id,
        challan_date: challanData.challan_date,
        remark: challanData.remark,
        bill_to: form.bill_to,
        ship_to: form.ship_to
      }

      if (invoice.delivery_challan?.id) {
        await api.put(`/logistics/delivery-challans/${invoice.delivery_challan.id}/`, payload)
      } else {
        await api.post('/logistics/delivery-challans/', payload)
      }
      alert("Delivery challan saved successfully!")
      onSaved?.()
      onClose()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || "Failed to save delivery challan.")
    } finally {
      setSaving(false)
    }
  }

  // Handle save based on active tab
  const handleSave = () => {
    if (activeTab === "packaging") {
      handleSavePackaging()
    } else if (activeTab === "challan") {
      handleSaveChallan()
    } else {
      handleSaveInvoice()
    }
  }

  // Status badge
  const StatusBadge = ({ status }) => {
    const map = {
      DRAFT: { bg: "#fffbe6", color: "#c8860a", label: "Draft" },
      CONFIRMED: { bg: "#e6fff5", color: "#0a9e6e", label: "Confirmed" },
      CANCELLED: { bg: "#fef2f2", color: "#dc2626", label: "Cancelled" },
    }
    const s = map[status] || { bg: "#f1f5f9", color: "#475569", label: status }
    return (
      <span style={{
        background: s.bg, color: s.color,
        padding: "4px 12px", borderRadius: 20,
        fontSize: 11, fontWeight: 700,
        display: "inline-flex", alignItems: "center", gap: 5
      }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color }} />
        {s.label}
      </span>
    )
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(15,23,42,.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, backdropFilter: "blur(4px)", padding: 20,
      fontFamily: FONT
    }}>
      <div style={{
        background: "#fff", borderRadius: 20,
        width: "100%", maxWidth: 1000,
        maxHeight: "90vh", display: "flex", flexDirection: "column",
        boxShadow: "0 25px 60px rgba(0,0,0,.25)",
        overflow: "hidden"
      }}>
        {/* Modal Header */}
        <div style={{
          padding: "20px 28px", borderBottom: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "linear-gradient(135deg, #f8fafc 0%, #fff 100%)",
          flexShrink: 0
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: PRIMARY, margin: 0 }}>
                Edit Invoice
              </h2>
              {invoice.invoice_number && (
                <span style={{ 
                  fontSize: 13, color: "#64748b", 
                  background: "#f1f5f9", padding: "4px 12px", 
                  borderRadius: 20, fontFamily: "monospace"
                }}>
                  #{invoice.invoice_number}
                </span>
              )}
              <StatusBadge status={invoice.status} />
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
              Order: {invoice.order_number || invoice.order?.order_number || "—"} 
              {invoice.back_order_number && ` · Dispatch: ${invoice.back_order_number}`}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: 10,
              border: `1px solid ${BORDER}`, background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 20, color: "#64748b",
              transition: "all .15s"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9" }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff" }}
          >
            ×
          </button>
        </div>

        {/* Tabs Navigation */}
        <div style={{ 
          borderBottom: `1px solid ${BORDER}`, padding: "0 24px", 
          display: "flex", gap: 4, flexShrink: 0, overflowX: "auto",
          background: "#fff"
        }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              disabled={isReadOnly && tab.key !== "details"}
              style={{
                padding: "14px 20px", background: "transparent", border: "none",
                borderBottom: activeTab === tab.key ? `2.5px solid ${PRIMARY}` : "2.5px solid transparent",
                color: activeTab === tab.key ? PRIMARY : "#64748b",
                fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500,
                cursor: (isReadOnly && tab.key !== "details") ? "not-allowed" : "pointer",
                fontFamily: FONT, marginBottom: -1,
                transition: "all .15s", whiteSpace: "nowrap",
                opacity: (isReadOnly && tab.key !== "details") ? 0.5 : 1
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px", background: "#fafafa" }}>
          {activeTab === "details" && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 24, border: `1px solid ${BORDER}` }}>
              <InvoiceDetailsTab form={form} setForm={setForm} />
            </div>
          )}
          {activeTab === "address" && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 24, border: `1px solid ${BORDER}` }}>
              <AddressContactTab form={form} setForm={setForm} />
            </div>
          )}
          {activeTab === "logistics" && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 24, border: `1px solid ${BORDER}` }}>
              <LogisticsTab form={form} setForm={setForm} />
            </div>
          )}
          {activeTab === "packaging" && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 24, border: `1px solid ${BORDER}` }}>
              <PackagingSlipTab 
                packagingData={packagingData} 
                setPackagingData={setPackagingData}
                invoiceNumber={form.invoice_number}
              />
            </div>
          )}
          {activeTab === "challan" && (
            <div style={{ background: "#fff", borderRadius: 12, padding: 24, border: `1px solid ${BORDER}` }}>
              <DeliveryChallanTab 
                challanData={challanData}
                setChallanData={setChallanData}
                invoiceNumber={form.invoice_number}
                billTo={form.bill_to}
                shipTo={form.ship_to}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 28px", borderTop: `1px solid ${BORDER}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "#fff", flexShrink: 0
        }}>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            {isConfirmed && (
              <span>⚠️ Confirmed invoices have limited edit options.</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={onClose}
              style={{
                padding: "10px 24px", background: "#fff", color: "#374151",
                border: `1.5px solid ${BORDER}`, borderRadius: 8,
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT,
                transition: "all .15s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc" }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || (isReadOnly && activeTab !== "packaging" && activeTab !== "challan")}
              style={{
                padding: "10px 28px", background: PRIMARY, color: "#fff",
                border: "none", borderRadius: 8,
                fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                fontFamily: FONT, opacity: saving ? 0.7 : 1,
                boxShadow: "0 2px 8px rgba(18,44,65,.2)",
                transition: "all .15s"
              }}
            >
              {saving ? "Saving…" : 
               activeTab === "packaging" ? "Save Packaging Slip" :
               activeTab === "challan" ? "Save Delivery Challan" : 
               "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}