import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar/Sidebar'
import Navbar from './Navbar/Navbar'

const pageTitles = {
  '/manager/dashboard': 'Dashboard',
  '/manager/customers': 'Customers',
  '/manager/enquiries': 'Enquiries',
  '/manager/quotations': 'Quotations',
  '/manager/employees': 'Employees',
  '/manager/permissions': 'Permissions',
  '/manager/order-acknowledgements': 'Order Acknowledgements',
  '/manager/orders': 'Orders',
  '/manager/proforma-invoice': 'Proforma Invoice',
  '/manager/reports': 'Reports',
}

export default function ManagerLayout() {
  const { pathname } = useLocation()
  const title = pageTitles[pathname] || 'ApoCorp'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f4f6fb' }}>
      <Sidebar role="manager" />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Navbar pageTitle={title} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}