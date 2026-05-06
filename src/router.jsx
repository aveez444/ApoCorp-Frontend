// router.jsx
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'

import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import EmployeeLayout from './components/EmployeeLayout'
import ManagerLayout from './components/ManagerLayout'

// Sales & Marketing imports (employee)
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
import NotificationsPage from './pages/employee/NotificationsPage'
import NotificationDetail from './pages/employee/NotificationDetail'
import SendNotification from './pages/manager/SendNotification'
import OrderList from './pages/employee/OrderList'
import VisitReportLanding from './pages/employee/Visitreportlanding'
import VisitReportFullList from './pages/employee/VisitReportFullList'
import VisitReportDetail from './pages/employee/VisitReportDetail'
import ListEnquiry from './pages/employee/ListEnquiry'

// Sales & Marketing imports (manager)
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
import ManagerOADetail from './pages/manager/ManagerOadetail'
import ManagerOAList from './pages/manager/Manageroalist'
import ManagerOrders from './pages/manager/ManagerOrders'
import ManagerProformaDetail from './pages/manager/Managerproformadetail'
import ManagerProformaInvoice from './pages/manager/Managerproformainvoice'
import ManagerOrderDetail from './pages/manager/Managerorderdetail'
import PermissionsManager from './pages/manager/PermissionsManager'
import ManagerQuotationDataList from './pages/manager/ManagerQuotationDataList'
import ManagerQuotationExternalDetail from './pages/manager/ManagerQuotationExternalDetail'
import ManagerVisitReportLanding from './pages/manager/Managervisitreportlanding'
import ManagerVisitReportFullList from './pages/manager/Managervisitreportfulllist'
import ManagerVisitReportDetail from './pages/manager/Managervisitreportdetail'

// Shared imports - LOGISTICS MODULE (same for both roles)
import CustomReports from './pages/shared/CustomReports'
import PendingInvoices from './pages/shared/logistics/Pendinginvoices'
import CreateDispatch from './pages/shared/logistics/CreateDispatch'
import BackOrders from './pages/shared/logistics/BackOrders'
import BackOrderDetail from './pages/shared/logistics/BackOrderDetail'
import InvoiceDetail from './pages/shared/logistics/InvoiceDetail'
import OrderTracking from './pages/shared/logistics/OrderTracking'
import LogisticsOrderDetail from './pages/shared/logistics/LogisticsOrderDetail'
import LogisticsDashboard from './pages/shared/logistics/LogisticsDashboard'
// import LogisticsDashboard from './pages/shared/logistics/LogisticsDashboard'
// import PendingInvoices from './pages/shared/logistics/PendingInvoices'
// import BackOrders from './pages/shared/logistics/BackOrders'
// import BackOrderDetail from './pages/shared/logistics/BackOrderDetail'
// import CreateDispatch from './pages/shared/logistics/CreateDispatch'

import Invoices from './pages/shared/logistics/Invoices'
import CreateInvoice from './pages/shared/logistics/CreateInvoice'
import OrderLogisticsList from './pages/shared/logistics/OrderLogisticsList'
import OrderLogisticsDetail from './pages/shared/logistics/OrderLogisticsDetail'

// import InvoiceDetail from './pages/shared/logistics/InvoiceDetail'
// import OrderTracking from './pages/shared/logistics/OrderTracking'
// import LogisticsOrderDetail from './pages/shared/logistics/LogisticsOrderDetail'

// import OrderLogisticsList from './pages/shared/logistics/OrderLogisticsList'
// import OrderLogisticsDetail from './pages/shared/logistics/OrderLogisticsDetail'
// import LogisticsDashboard from './pages/shared/logistics/LogisticsDashboard'


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
  // Public routes
  { path: '/login', element: <Login /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  
  // Employee routes
  {
    path: '/employee',
    element: (
      <ProtectedRoute allowedRole="employee">
        <EmployeeLayout />
      </ProtectedRoute>
    ),
    children: [
      // Sales & Marketing routes
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'customers', element: <Customers /> },
      { path: 'customers/list', element: <CustomerList /> },
      { path: 'customers/new', element: <AddCustomer /> },
      { path: 'customers/:id', element: <CustomerDetail /> },
      { path: 'enquiries', element: <Enquiries /> },
      { path: 'enquiries/:id', element: <EnquiryDetail /> },
      { path: 'enquiries/list', element: <ListEnquiry /> },
      { path: 'quotations', element: <Quotations /> },
      { path: 'quotations/:id', element: <QuotationDetail /> },
      { path: 'quotations/:id/external', element: <QuotationExternalDetail /> },
      { path: 'quotation-data', element: <QuotationDataList /> },
      { path: 'order-acknowledgements', element: <OAList /> },
      { path: 'order-acknowledgements/new', element: <OADetail /> },
      { path: 'order-acknowledgements/:id', element: <OADetail /> },
      { path: 'orders', element: <Orders /> },
      { path: 'orders/:id', element: <OrderDetail /> },
      { path: 'orders/list', element: <OrderList /> },
      { path: 'proforma-invoice', element: <ProformaInvoice /> },
      { path: 'proforma-invoices/:id', element: <ProformaDetail /> },
      { path: 'reports/visit-reports', element: <VisitReportLanding /> },
      { path: 'reports/visit-reports/:id', element: <VisitReportDetail /> },
      { path: 'reports/visit-reports/all', element: <VisitReportFullList /> },
      { path: 'reports/custom', element: <CustomReports role="employee" /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'notifications/:id', element: <NotificationDetail /> },

      // Logistics routes (shared - same component for both roles)
      // { path: 'logistics/dashboard', element: <LogisticsDashboard role="employee" /> },
      { path: 'logistics/pending-invoices', element: <PendingInvoices role="employee" /> },
      { path: 'logistics/create-dispatch/:orderId', element: <CreateDispatch role="employee" /> },
      { path: 'logistics/back-orders', element: <BackOrders role="employee" /> },
      { path: 'logistics/back-orders/:id', element: <BackOrderDetail role="employee" /> },

      { path: 'logistics/invoices', element: <Invoices role="employee" /> },
      { path: 'logistics/invoices/create', element: <CreateInvoice role="employee" /> },
      { path: 'logistics/invoices/:id', element: <InvoiceDetail role="employee" /> },

      { path: 'logistics/order-tracking', element: <OrderTracking role="employee" /> },
      { path: 'logistics/order/:id', element: <LogisticsOrderDetail role="employee" /> },

      { path: 'logistics/dashboard', element: <LogisticsDashboard role="employee" /> },

      { path: 'logistics/order-logistics', element: <OrderLogisticsList role="employee" /> },
      { path: 'logistics/order-logistics/:id', element: <OrderLogisticsDetail role="employee" /> },

    
    ],
  },
  
  // Manager routes
  {
    path: '/manager',
    element: (
      <ProtectedRoute allowedRole="manager">
        <ManagerLayout />
      </ProtectedRoute>
    ),
    children: [
      // Sales & Marketing routes
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
      { path: 'proforma-invoice', element: <ManagerProformaInvoice /> },
      { path: 'proforma-invoices/:id', element: <ManagerProformaDetail /> },
      { path: 'permissions', element: <PermissionsManager /> },
      { path: 'reports/visit-reports', element: <ManagerVisitReportLanding /> },
      { path: 'reports/visit-reports/all', element: <ManagerVisitReportFullList /> },
      { path: 'reports/visit-reports/:id', element: <ManagerVisitReportDetail /> },
      { path: 'reports/custom', element: <CustomReports role="manager" /> },

      // Logistics routes (shared - same component for both roles)
  
      { path: 'logistics/pending-invoices', element: <PendingInvoices role="manager" /> },
      { path: 'logistics/back-orders', element: <BackOrders role="manager" /> },
      { path: 'logistics/create-dispatch/:orderId', element: <CreateDispatch role="manager" /> },
      { path: 'logistics/back-orders/:id', element: <BackOrderDetail role="manager" /> },

      { path: 'logistics/invoices', element: <Invoices role="manager" /> },
      { path: 'logistics/invoices/create', element: <CreateInvoice role="manager" /> },
      { path: 'logistics/invoices/:id', element: <InvoiceDetail role="manager" /> },
      
      { path: 'logistics/order-tracking', element: <OrderTracking role="manager" /> },
      { path: 'logistics/order/:id', element: <LogisticsOrderDetail role="manager" /> },

      { path: 'logistics/dashboard', element: <LogisticsDashboard role="manager" /> },

      { path: 'logistics/order-logistics', element: <OrderLogisticsList role="manager" /> },
      { path: 'logistics/order-logistics/:id', element: <OrderLogisticsDetail role="manager" /> },


    ]},
  
  // Root and catch-all routes
  { path: '/', element: <RootRedirect /> },
  { path: '*', element: <Navigate to="/login" replace /> },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}