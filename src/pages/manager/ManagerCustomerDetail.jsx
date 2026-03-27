// Re-uses the shared CustomerDetail component — only the back-navigation differs.
import CustomerDetail from '../employee/CustomerDetail'
export default function ManagerCustomerDetail() {
  return <CustomerDetail basePath="/manager/customers" />
}