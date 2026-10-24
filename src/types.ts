export const ORDER_STATUSES = [
  'Completed',
  'Processing',
  'Pending',
  'Delayed',
  'Cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type DateRange = 7 | 30 | 90;

export interface Order {
  id: string;
  customer: string;
  item: string;
  date: string;
  amount: number;
  status: OrderStatus;
}

export type AlertType = 'critical' | 'warning' | 'info';
export type AlertAction = 'Review order' | 'Review operations';

export interface DashboardAlert {
  id: string;
  type: AlertType;
  title: string;
  detail: string;
  time: string;
  action: AlertAction;
}

export interface ActivityEvent {
  id: string;
  title: string;
  detail: string;
  time: string;
  type: 'success' | 'info' | 'neutral';
}

export interface DailyAggregate {
  date: Date;
  revenue: number;
  orders: number;
  completed: number;
  active: number;
}

export interface StatusCount {
  status: OrderStatus;
  count: number;
}

export type DashboardPage =
  | 'Overview'
  | 'Analytics'
  | 'Orders'
  | 'Customers'
  | 'Operations'
  | 'Reports'
  | 'Settings';

export type DataScenario = 'success' | 'empty' | 'error';

export interface DashboardData {
  orders: Order[];
  alerts: DashboardAlert[];
  activity: ActivityEvent[];
  refreshedAt: string;
}
