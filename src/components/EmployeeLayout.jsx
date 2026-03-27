import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar/Sidebar'
import Navbar from './Navbar/Navbar'

const pageTitles = {
  '/employee/dashboard': 'Dashboard',
  '/employee/customers': 'Customers',
  '/employee/enquiries': 'Enquiries',
  '/employee/quotations': 'Quotations',
  '/employee/order-acknowledgements': 'Order Acknowledgements',
  '/employee/orders': 'Orders',
  '/employee/proforma-invoice': 'Proforma Invoice',
  '/employee/reports': 'Reports',
}

export default function EmployeeLayout() {
  const { pathname } = useLocation()
  const title = pageTitles[pathname] || 'ApoCorp'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f4f6fb' }}>
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Navbar pageTitle={title} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
