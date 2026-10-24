import { isValidRange } from './utils.ts';
import type {
  ActivityEvent,
  DailyAggregate,
  DashboardAlert,
  Order,
  OrderStatus,
  StatusCount,
} from './types.ts';

const accountNames = [
  'Acme Studio', 'Northstar Labs', 'Evergreen Co.', 'Vertex Systems', 'Cedar & Stone',
  'Parallel Works', 'Monarch Supply', 'Fieldwork Inc.', 'Sonder Goods', 'Atlas & Co.',
  'Brightline Group', 'Goodwell Market', 'Juniper House', 'Meridian Tech', 'Common Thread',
];

const items = [
  'Quarterly supply order', 'Workspace essentials', 'Equipment renewal', 'Custom packaging',
  'Office replenishment', 'Partner fulfillment', 'Field kit shipment', 'Product restock',
];

const statusPool: OrderStatus[] = ['Completed', 'Completed', 'Completed', 'Processing', 'Processing', 'Pending', 'Delayed', 'Cancelled'];
const dayMs = 24 * 60 * 60 * 1000;
const today = new Date();
today.setUTCHours(12, 0, 0, 0);

export const orders: Order[] = Array.from({ length: 540 }, (_, index) => {
  const dayOffset = 179 - Math.floor(index / 3);
  const date = new Date(today.getTime() - dayOffset * dayMs);
  date.setUTCDate(date.getUTCDate() - ((index * 7) % 5 === 0 ? 1 : 0));
  const customerIndex = (index * 7 + Math.floor(index / 11)) % accountNames.length;
  const amount = 180 + ((index * 173 + (index % 7) * 319) % 4920);
  const status = statusPool[(index * 5 + Math.floor(index / 9)) % statusPool.length];
  return {
    id: `NX-${String(5830 + index).padStart(5, '0')}`,
    customer: accountNames[customerIndex],
    item: items[(index * 3 + customerIndex) % items.length],
    date: date.toISOString().slice(0, 10),
    amount,
    status,
  };
});

export const alertsSeed: DashboardAlert[] = [
  { id: 'a1', type: 'critical', title: 'Shipment running behind', detail: 'NX-06365 · Meridian Tech', time: '12 min ago', action: 'Review order' },
  { id: 'a2', type: 'warning', title: 'Stock below reorder point', detail: 'Packaging · 18 units remaining', time: '48 min ago', action: 'Review operations' },
  { id: 'a3', type: 'info', title: 'Approval waiting on you', detail: 'NX-06368 · Cedar & Stone', time: '2 hours ago', action: 'Review order' },
];

export const activity: ActivityEvent[] = [
  { id: 'e1', title: 'Order delivered', detail: 'NX-06367 · Juniper House', time: '9:42 AM', type: 'success' },
  { id: 'e2', title: 'New order received', detail: 'NX-06368 · Cedar & Stone', time: '9:18 AM', type: 'info' },
  { id: 'e3', title: 'Inventory updated', detail: 'Workspace essentials · +120 units', time: '8:56 AM', type: 'neutral' },
  { id: 'e4', title: 'Payment confirmed', detail: 'NX-06369 · Juniper House', time: '8:31 AM', type: 'success' },
];

export function getRangeStart(range: number | string, end = today): Date {
  if (!isValidRange(range)) throw new RangeError('Date range must be 7, 30, or 90 days.');
  if (!(end instanceof Date) || Number.isNaN(end.getTime())) throw new TypeError('Date range end must be a valid date.');
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - Number(range) + 1);
  return start;
}

export function filterOrdersByRange(records: readonly Order[], range: number | string, end = today): Order[] {
  const start = getRangeStart(range, end);
  return records.filter((order) => {
    const date = new Date(`${order.date}T12:00:00Z`);
    return date >= start && date <= end;
  });
}

export function aggregateByDay(records: readonly Order[], range: number | string, end = today): DailyAggregate[] {
  const days = Number(range);
  if (!isValidRange(range)) throw new RangeError('Date range must be 7, 30, or 90 days.');
  const rangeEnd = new Date(end);
  const start = getRangeStart(days, rangeEnd);
  const bucket = new Map<string, DailyAggregate & { activeCustomers: Set<string> }>();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + i);
    bucket.set(date.toISOString().slice(0, 10), {
      date, revenue: 0, orders: 0, completed: 0, active: 0, activeCustomers: new Set(),
    });
  }
  records.forEach((order) => {
    const entry = bucket.get(order.date);
    if (entry) {
      if (order.status !== 'Cancelled') entry.revenue += order.amount;
      entry.orders += 1;
      if (order.status === 'Completed') entry.completed += 1;
      entry.activeCustomers.add(order.customer);
    }
  });
  return [...bucket.values()].map(({ activeCustomers, ...entry }) => ({
    ...entry,
    active: activeCustomers.size,
  }));
}

export function getPreviousPeriod(records: readonly Order[], range: number | string, end = today): Order[] {
  if (!isValidRange(range)) throw new RangeError('Date range must be 7, 30, or 90 days.');
  const previousEnd = getRangeStart(Number(range), end);
  previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
  return filterOrdersByRange(records, range, previousEnd);
}

export function statusCounts(records: readonly Order[]): StatusCount[] {
  const statuses: OrderStatus[] = ['Completed', 'Processing', 'Pending', 'Delayed', 'Cancelled'];
  return statuses.map((status) => ({
    status,
    count: records.filter((record) => record.status === status).length,
  }));
}
