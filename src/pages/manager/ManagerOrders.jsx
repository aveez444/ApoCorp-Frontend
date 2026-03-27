import Orders from '../employee/Orders'

/**
 * Manager Orders page — reuses the employee Orders list component.
 * Only the basePath differs so navigation targets /manager/orders/...
 */
export default function ManagerOrders() {
  return <Orders basePath="/manager/orders" />
}