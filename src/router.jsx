import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'

import Login from './pages/Login'
import EmployeeLayout from './components/EmployeeLayout'
import ManagerLayout from './components/ManagerLayout'

import Dashboard from './pages/employee/Dashboard'

import Customers from './pages/employee/Customers'
import CustomerList from './pages/employee/CustomerList'
import AddCustomer from './pages/employee/AddCustomer'
import CustomerDetail from './pages/employee/CustomerDetail'

import Enquiries from './pages/employee/Enquiries'
import EnquiryDetail from './pages/employee/EnquiryDetail'

import Quotations from './pages/employee/Quotations'
import QuotationDetail from './pages/employee/QuotationDetail'
import QuotationExternalDetail from './pages/employee/QuotationExternalDetail'
import QuotationDataList from './pages/employee/QuotationDataList'

import OAList from './pages/employee/Oalist'
import OADetail from './pages/employee/Oadetail' 

import Orders from './pages/employee/Orders'
import OrderDetail from './pages/employee/OrderDetail'

import ProformaInvoice from './pages/employee/ProformaInvoice'
import ProformaDetail from './pages/employee/ProformaDetail'

// Notifications
import NotificationsPage   from './pages/employee/NotificationsPage'
import NotificationDetail  from './pages/employee/NotificationDetail'
import SendNotification    from './pages/manager/SendNotification'


// Manager pages
import ManagerDashboard from './pages/manager/ManagerDashboard'

import ManagerCustomers from './pages/manager/ManagerCustomers'
import ManagerCustomerList from './pages/manager/ManagerCustomerList'
import ManagerAddCustomer from './pages/manager/ManagerAddCustomer'
import ManagerCustomerDetail from './pages/manager/ManagerCustomerDetail'

import ManagerEnquiries from './pages/manager/ManagerEnquiries'
import ManagerEnquiryAllList from './pages/manager/ManagerEnquiryAllList'
import ManagerEnquiryDetail from './pages/manager/ManagerEnquiryDetail'

import ManagerQuotations from './pages/manager/ManagerQuotations'
import ManagerQuotationDetail from './pages/manager/ManagerQuotationDetail'
import ListEnquiry from './pages/employee/ListEnquiry'

import ManagerOADetail from './pages/manager/ManagerOAdetail'
import ManagerOAList from './pages/manager/Manageroalist'
import ManagerOrders from './pages/manager/ManagerOrders'
import ManagerProformaDetail from './pages/manager/Managerproformadetail'
import ManagerProformaInvoice from './pages/manager/Managerproformainvoice'
import ManagerOrderDetail from './pages/manager/Managerorderdetail'
import PermissionsManager from './pages/manager/PermissionsManager'
import ManagerQuotationDataList from './pages/manager/ManagerQuotationDataList'
import ManagerQuotationExternalDetail from './pages/manager/ManagerQuotationExternalDetail'
import OrderList from './pages/employee/OrderList'
import VisitReportLanding from './pages/employee/VisitReportLanding'
import VisitReportFullList from './pages/employee/VisitReportFullList'
import ManagerVisitReportLanding from './pages/manager/Managervisitreportlanding'
import ManagerVisitReportFullList from './pages/manager/Managervisitreportfulllist'
import ManagerVisitReportDetail from './pages/manager/Managervisitreportdetail'
import VisitReportDetail from './pages/employee/VisitReportDetail'





function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'manager' ? '/manager/dashboard' : '/employee/dashboard'} replace />
  }
  return children
}

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'manager') return <Navigate to="/manager/dashboard" replace />
  return <Navigate to="/employee/dashboard" replace />
}

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/employee',
    element: (
      <ProtectedRoute allowedRole="employee">
        <EmployeeLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'customers', element: <Customers /> },
      { path: 'customers/list', element: <CustomerList /> },
      { path: 'customers/new', element: <AddCustomer /> },
      { path: 'customers/:id', element: <CustomerDetail /> },
      // Enquiries
      { path: 'enquiries', element: <Enquiries /> },
      { path: 'enquiries/:id', element: <EnquiryDetail /> },
      { path: 'enquiries/list', element: <ListEnquiry /> },
      // Quotations
      { path: 'quotations', element: <Quotations /> },
      { path: 'quotations/:id', element: <QuotationDetail /> },
      { path: 'quotations/:id/external', element: <QuotationExternalDetail /> },
      { path: 'quotation-data', element: <QuotationDataList /> },
      // Order flow
      { path: 'order-acknowledgements', element: <OAList /> },
      { path: 'order-acknowledgements/new', element: <OADetail /> },
      { path: 'order-acknowledgements/:id', element: <OADetail /> },

      { path: 'orders', element: <Orders /> },
      { path: 'orders/:id', element: <OrderDetail /> },  // ← add this
      { path: 'orders/list', element: <OrderList /> },

      // Proforma Invoice
      { path: 'proforma-invoice', element: <ProformaInvoice /> },
      { path: 'proforma-invoices/:id', element: <ProformaDetail /> }, // Changed from 'proforma/:id'
      // Reports
      { path: 'reports/visit-reports', element: <VisitReportLanding /> },
      { path: 'reports/visit-reports/:id', element: <VisitReportDetail /> },
      { path: 'reports/visit-reports/all', element: <VisitReportFullList  /> },

     

      // Notifications
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'notifications/:id', element: <NotificationDetail /> },

    ],
  },
  {
    path: '/manager',
    element: (
      <ProtectedRoute allowedRole="manager">
        <ManagerLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <ManagerDashboard /> },
      { path: 'enquiries', element: <ManagerEnquiries /> },
      { path: 'enquiries/all', element: <ManagerEnquiryAllList /> },
      { path: 'enquiries/:id', element: <ManagerEnquiryDetail /> },


      { path: 'quotations', element: <ManagerQuotations /> },
      { path: 'quotation-data', element: <ManagerQuotationDataList /> },
      { path: 'quotations/:id', element: <ManagerQuotationDetail /> },
      { path: 'quotations/:id/external', element: <ManagerQuotationExternalDetail /> },

      
      { path: 'customers', element: <ManagerCustomers /> },
      { path: 'customers/list', element: <ManagerCustomerList /> },
      { path: 'customers/new', element: <ManagerAddCustomer /> },
      { path: 'customers/:id', element: <ManagerCustomerDetail /> },


      { path: 'notifications/send', element: <SendNotification /> },


      { path: 'order-acknowledgements', element: <ManagerOAList /> },
      { path: 'order-acknowledgements/new', element: <ManagerOADetail /> },
      { path: 'order-acknowledgements/:id', element: <ManagerOADetail /> },

      
      { path: 'orders', element: <ManagerOrders /> },
      { path: 'orders/:id', element: <ManagerOrderDetail /> },


      { path: 'proforma-invoice',      element: <ManagerProformaInvoice /> },
      { path: 'proforma-invoices/:id', element: <ManagerProformaDetail /> },


      { path: 'permissions', element: <PermissionsManager /> },

      { path: 'reports/visit-reports', element: <ManagerVisitReportLanding /> },
      { path: 'reports/visit-reports/all', element: <ManagerVisitReportFullList  /> },
      { path: 'reports/visit-reports/:id', element: <ManagerVisitReportDetail /> },

    

    ],
  },
  { path: '/', element: <RootRedirect /> },
  { path: '*', element: <Navigate to="/login" replace /> },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}