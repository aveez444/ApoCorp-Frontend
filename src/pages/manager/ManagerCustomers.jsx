// Re-uses the shared Customers component — only the basePath differs.
import Customers from '../employee/Customers'
export default function ManagerCustomers() {
  return <Customers basePath="/manager/customers" />
}