// pages/shared/logistics/CreateDispatch.jsx
import { useEffect, useState, useCallback } from "react"
import { useNavigate, useParams } from "react-router-dom"
import api from "../../../api/axios"

const PRIMARY = "#122C41"
const BORDER = "#e2e8f0"
const FONT = "'Inter', 'Segoe UI', sans-serif"

const fmtAmt = n => `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n ?? 0)}`

export default function CreateDispatch({ role = "manager" }) {
  const navigate = useNavigate()
  const { orderId } = useParams()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [order, setOrder] = useState(null)
  const [dispatchItems, setDispatchItems] = useState([])
  const [reason, setReason] = useState("")
  const [expectedDispatchDate, setExpectedDispatchDate] = useState("")
  const [error, setError] = useState(null)

  // Fetch order with dispatch summary
  const fetchOrder = useCallback(async () => {
    if (!orderId || orderId === "undefined") {
      setError("Invalid order ID. Please go back and try again.")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log("Fetching dispatch summary for order:", orderId)
      const res = await api.get(`/logistics/back-orders/dispatch_summary/?order_id=${orderId}`)
      const data = res.data
      setOrder(data)
      
      // Initialize dispatch items with ALL fields from OA line items
      const items = data.line_items.map(item => ({
        oa_line_item_id: item.oa_line_item_id,
        description: item.description,
        part_no: item.part_no,
        total_quantity: item.total_quantity,
        shipped_quantity: item.shipped_quantity,
        remaining_quantity: item.remaining_quantity,
        quantity_dispatching: 0,
        unit: item.unit,
        unit_price: item.unit_price,
        hsn_code: item.hsn_code,
        tax_percent: item.tax_percent,
        tax_group_code: item.tax_group_code,
        job_code: item.job_code || '',
        customer_part_no: item.customer_part_no || '',
      }))
      setDispatchItems(items)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || "Failed to load order details")
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => { 
    if (orderId && orderId !== "undefined") {
      fetchOrder() 
    } else {
      setError("Invalid order ID")
      setLoading(false)
    }
  }, [fetchOrder, orderId])

  const handleQuantityChange = (index, value) => {
    const qty = parseFloat(value) || 0
    const maxQty = dispatchItems[index].remaining_quantity
    
    if (qty > maxQty) {
      alert(`Maximum quantity available: ${maxQty}`)
      return
    }
    
    const updated = [...dispatchItems]
    updated[index].quantity_dispatching = qty
    setDispatchItems(updated)
  }

  const handleSelectAll = () => {
    const updated = dispatchItems.map(item => ({
      ...item,
      quantity_dispatching: item.remaining_quantity
    }))
    setDispatchItems(updated)
  }

  const handleClearAll = () => {
    const updated = dispatchItems.map(item => ({
      ...item,
      quantity_dispatching: 0
    }))
    setDispatchItems(updated)
  }

  const getTotalQuantity = () => {
    return dispatchItems.reduce((sum, item) => sum + (item.quantity_dispatching || 0), 0)
  }

  const getTotalValue = () => {
    return dispatchItems.reduce((sum, item) => {
      const qty = item.quantity_dispatching || 0
      const price = item.unit_price || 0
      return sum + (qty * price)
    }, 0)
  }

  const handleSubmit = async () => {
    const selectedItems = dispatchItems.filter(item => item.quantity_dispatching > 0)
    
    if (selectedItems.length === 0) {
      alert("Please select at least one item to dispatch")
      return
    }
    
    const payload = {
      order: orderId,
      reason: reason || "Partial dispatch",
      expected_dispatch_date: expectedDispatchDate || null,
      line_items: selectedItems.map(item => ({
        oa_line_item: item.oa_line_item_id,
        quantity_dispatching: item.quantity_dispatching,
        // Include all fields for snapshot
        unit_price: item.unit_price || 0,
        description: item.description || '',
        part_no: item.part_no || '',
        unit: item.unit || '',
        hsn_code: item.hsn_code || '',
        tax_percent: item.tax_percent || 0,
        tax_group_code: item.tax_group_code || '',
        job_code: item.job_code || '',
        customer_part_no: item.customer_part_no || '',
      }))
    }
    
    setSaving(true)
    try {
      const res = await api.post("/logistics/back-orders/", payload)
      alert(`Dispatch created successfully! BackOrder #${res.data.back_order_number}`)
      navigate(`/${role}/logistics/back-orders`)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || err.response?.data?.line_items?.[0] || "Failed to create dispatch")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ fontFamily: FONT, display: "flex", justifyContent: "center", padding: 60 }}>
        Loading order details...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ fontFamily: FONT, padding: 40, textAlign: "center", color: "#dc2626" }}>
        <p>{error}</p>
        <button
          onClick={() => navigate(`/${role}/logistics/pending-invoices`)}
          style={{
            marginTop: 20,
            background: PRIMARY,
            color: "#fff",
            border: "none",
            padding: "10px 24px",
            borderRadius: 8,
            cursor: "pointer"
          }}
        >
          Go Back to Pending Invoices
        </button>
      </div>
    )
  }

  const hasSelections = getTotalQuantity() > 0

  return (
    <div style={{ fontFamily: FONT, background: "#f8fafc", minHeight: "100vh", paddingBottom: 48 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px" }}>
        
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}
          >
            ← Back to Pending Invoices
          </button>
          <h1 style={{ margin: 0, fontSize: 24, color: PRIMARY }}>Create New Dispatch</h1>
          <p style={{ color: "#64748b", marginTop: 8 }}>
            Order: {order?.order_number} • {order?.order_category}
          </p>
          <p style={{ color: "#0a9e6e", marginTop: 4, fontSize: 13 }}>
            Completion: {order?.completion_percentage}% • Shipped: {order?.shipped_quantity} / {order?.total_quantity}
          </p>
        </div>

        {/* Dispatch Form Card */}
        <div style={{
          background: "#fff",
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          padding: "24px",
          marginBottom: 24,
        }}>
          
          {/* Dispatch Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", display: "block", marginBottom: 6 }}>
                Reason for Dispatch
              </label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g., Partial shipment, Urgent requirement"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: `1.5px solid ${BORDER}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: FONT,
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", display: "block", marginBottom: 6 }}>
                Expected Dispatch Date
              </label>
              <input
                type="date"
                value={expectedDispatchDate}
                onChange={e => setExpectedDispatchDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: `1.5px solid ${BORDER}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: FONT,
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <button
              onClick={handleSelectAll}
              style={{
                background: "#f1f5f9",
                border: "none",
                padding: "8px 16px",
                borderRadius: 6,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Select All Available
            </button>
            <button
              onClick={handleClearAll}
              style={{
                background: "#f1f5f9",
                border: "none",
                padding: "8px 16px",
                borderRadius: 6,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Clear All
            </button>
          </div>

          {/* Line Items Table */}
          <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${BORDER}` }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#475569" }}>Product</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#475569" }}>Part No.</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "#475569" }}>Total Qty</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "#475569" }}>Already Shipped</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "#475569" }}>Remaining</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "#475569" }}>Unit Price</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "#475569" }}>Qty to Dispatch</th>
                </tr>
              </thead>
              <tbody>
                {dispatchItems.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>{item.description || '—'}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontFamily: "monospace" }}>{item.part_no || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "right" }}>{item.total_quantity}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "right", color: "#64748b" }}>{item.shipped_quantity}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "right", fontWeight: 600, color: PRIMARY }}>{item.remaining_quantity}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, textAlign: "right", fontWeight: 500 }}>
                      {item.unit_price ? fmtAmt(item.unit_price) : '—'}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <input
                        type="number"
                        min="0"
                        max={item.remaining_quantity}
                        step="1"
                        value={item.quantity_dispatching}
                        onChange={e => handleQuantityChange(idx, e.target.value)}
                        style={{
                          width: 100,
                          padding: "6px 10px",
                          border: `1.5px solid ${BORDER}`,
                          borderRadius: 6,
                          fontSize: 13,
                          textAlign: "right",
                          fontFamily: FONT,
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot style={{ background: "#f8fafc" }}>
                <tr>
                  <td colSpan={5} style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>
                    Total Quantity to Dispatch:
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: PRIMARY }}>
                    {fmtAmt(getTotalValue())}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: PRIMARY }}>
                    {getTotalQuantity()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Submit Buttons */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 28 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                padding: "10px 24px",
                background: "#fff",
                border: `1.5px solid ${BORDER}`,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !hasSelections}
              style={{
                padding: "10px 28px",
                background: hasSelections ? PRIMARY : "#cbd5e1",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: hasSelections ? "pointer" : "not-allowed",
              }}
            >
              {saving ? "Creating Dispatch..." : "Create Dispatch"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}