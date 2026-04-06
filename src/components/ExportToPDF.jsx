// src/components/ExportToPDF.jsx
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const fmt = n => new Intl.NumberFormat("en-IN").format(n ?? 0)

export const exportToPDF = (filteredEnquiries, stats) => {
  const doc = new jsPDF('landscape', 'mm', 'a4')
  
  // Add title
  doc.setFontSize(18)
  doc.setTextColor(18, 44, 65)
  doc.text('Enquiries Report', 14, 20)
  
  // Add generation date
  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  const dateStr = new Date().toLocaleString()
  doc.text(`Generated: ${dateStr}`, 14, 30)
  doc.text(`Total Enquiries: ${filteredEnquiries.length}`, 14, 37)
  
  // Add summary stats
  doc.setFontSize(11)
  doc.setTextColor(18, 44, 65)
  doc.text('Summary', 14, 48)
  
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`Pending: ${fmt(stats?.pending || 0)}`, 14, 55)
  doc.text(`Negotiation: ${fmt(stats?.under_negotiation || 0)}`, 60, 55)
  doc.text(`PO Received: ${fmt(stats?.po_received || 0)}`, 120, 55)
  doc.text(`Lost: ${fmt(stats?.lost || 0)}`, 190, 55)
  
  // Prepare table data
  const tableData = filteredEnquiries.map(enquiry => [
    enquiry.enquiry_number || '-',
    enquiry.enquiry_date || '-',
    enquiry.target_submission_date || '-',
    enquiry.customer_detail?.company_name || '-',
    `₹${fmt(enquiry.prospective_value)}`,
    enquiry.customer_detail?.telephone_primary || '-',
    enquiry.enquiry_type || '-',
    [enquiry.customer_detail?.city, enquiry.customer_detail?.country].filter(Boolean).join(', ') || '-',
    enquiry.status?.replace('_', ' ') || '-'
  ])
  
  // Add table
  autoTable(doc, {
    startY: 62,
    head: [['Enquiry No.', 'Date', 'Target Date', 'Entity Name', 'Value', 'Phone', 'Type', 'Location', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [18, 44, 65],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { cellWidth: 35 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
      6: { cellWidth: 20 },
      7: { cellWidth: 30 },
      8: { cellWidth: 25 }
    },
    margin: { left: 14, right: 14 }
  })
  
  // Save PDF
  doc.save(`enquiries_report_${new Date().toISOString().split('T')[0]}.pdf`)
}