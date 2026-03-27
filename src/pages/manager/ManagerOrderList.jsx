import OrderList from '../employee/OrderList'

export default function ManagerOrderList() {
  return <OrderList basePath="/manager/orders" showSalesRep={true} showPriority={true} />
}