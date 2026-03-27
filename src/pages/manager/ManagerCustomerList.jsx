// Re-uses the shared CustomerList component — only the basePath differs.
import CustomerList from '../employee/CustomerList'
export default function ManagerCustomerList() {
  return <CustomerList basePath="/manager/customers" />
}