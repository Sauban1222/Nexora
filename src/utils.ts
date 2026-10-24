import { ORDER_STATUSES, type DateRange, type Order, type OrderStatus } from './types.ts';

export { ORDER_STATUSES };
export const VALID_RANGES: readonly DateRange[] = Object.freeze([7, 30, 90]);

export const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const number = new Intl.NumberFormat('en-US');

export function formatDate(
  value: string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
) {
  return new Intl.DateTimeFormat('en-US', options).format(new Date(`${value}T12:00:00`));
}

export function percentChange(current: number, previous: number): number | null {
  if (!previous) return current ? null : 0;
  return ((current - previous) / previous) * 100;
}

export function sumRevenue(records: readonly Order[]): number {
  return records.reduce((sum, record) => sum + (record.status === 'Cancelled' ? 0 : record.amount), 0);
}

export function isValidRange(value: unknown): value is DateRange {
  return typeof value !== 'boolean' && value !== null && value !== ''
    && VALID_RANGES.includes(Number(value) as DateRange);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && (ORDER_STATUSES as readonly string[]).includes(value);
}

function isValidOrderRecord(record: unknown): record is Order {
  if (!isRecord(record)) return false;
  const date = record.date;
  return typeof record.id === 'string'
    && Boolean(record.id.trim())
    && typeof record.customer === 'string'
    && Boolean(record.customer.trim())
    && typeof record.item === 'string'
    && Boolean(record.item.trim())
    && typeof record.amount === 'number'
    && Number.isFinite(record.amount)
    && record.amount >= 0
    && isOrderStatus(record.status)
    && typeof date === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(date)
    && !Number.isNaN(new Date(`${date}T12:00:00Z`).getTime())
    && new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date;
}

export function validateOrders(records: unknown): string[] {
  if (!Array.isArray(records)) return ['Order data must be a list.'];

  const issues: string[] = [];
  const ids = new Set<string>();
  records.forEach((record, index) => {
    const row = index + 1;
    if (!isRecord(record)) {
      issues.push(`Order ${row} must be a record.`);
      return;
    }
    if (typeof record.id !== 'string' || !record.id.trim()) {
      issues.push(`Order ${row} is missing a reference ID.`);
    } else if (ids.has(record.id)) {
      issues.push(`Order ${row} has a duplicate reference ID.`);
    } else {
      ids.add(record.id);
    }
    for (const field of ['customer', 'item']) {
      if (typeof record[field] !== 'string' || !record[field].trim()) {
        issues.push(`Order ${row} is missing ${field === 'customer' ? 'a customer' : 'an item'}.`);
      }
    }
    if (typeof record.amount !== 'number' || !Number.isFinite(record.amount) || record.amount < 0) {
      issues.push(`Order ${row} has an invalid amount.`);
    }
    if (!isOrderStatus(record.status)) {
      issues.push(`Order ${row} has an invalid status.`);
    }
    if (typeof record.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(record.date)
      || Number.isNaN(new Date(`${record.date}T12:00:00Z`).getTime())
      || new Date(`${record.date}T12:00:00Z`).toISOString().slice(0, 10) !== record.date) {
      issues.push(`Order ${row} has an invalid date.`);
    }
  });
  return issues;
}

export function parseOrders(records: unknown): Order[] {
  const issues = validateOrders(records);
  if (issues.length) throw new TypeError(issues.slice(0, 3).join(' '));
  if (!Array.isArray(records)) throw new TypeError('Order data must be a list.');
  return records.filter(isValidOrderRecord);
}

export interface OrderSummary {
  revenue: number;
  previousRevenue: number;
  orderCount: number;
  previousOrderCount: number;
  activeCustomers: number;
  previousActiveCustomers: number;
  completed: number;
  completionRate: number;
  completionChange: number;
}

export function summarizeOrders(current: readonly Order[], previous: readonly Order[]): OrderSummary {
  const completed = current.filter((record) => record.status === 'Completed').length;
  const previousCompleted = previous.filter((record) => record.status === 'Completed').length;
  const completionRate = current.length ? completed / current.length * 100 : 0;
  const previousCompletionRate = previous.length ? previousCompleted / previous.length * 100 : 0;
  return {
    revenue: sumRevenue(current),
    previousRevenue: sumRevenue(previous),
    orderCount: current.length,
    previousOrderCount: previous.length,
    activeCustomers: new Set(current.map((record) => record.customer)).size,
    previousActiveCustomers: new Set(previous.map((record) => record.customer)).size,
    completed,
    completionRate,
    completionChange: completionRate - previousCompletionRate,
  };
}

export function csvEscape(value: unknown): string {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}
