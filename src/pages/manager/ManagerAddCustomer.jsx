// Re-uses the shared AddCustomer component — only the redirect after save differs.
import AddCustomer from '../employee/AddCustomer'
export default function ManagerAddCustomer() {
  return <AddCustomer basePath="/manager/customers" />
}