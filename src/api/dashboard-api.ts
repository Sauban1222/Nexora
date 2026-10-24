import type {
  ActivityEvent,
  DashboardAlert,
  DashboardData,
  DataScenario,
  DateRange,
} from '../types.ts';
import { parseOrders, validateOrders } from '../utils.ts';

const apiBaseUrl = typeof window === 'undefined' ? 'http://localhost' : '';

export class DashboardApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DashboardApiError';
  }
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new DashboardApiError(`Dashboard request failed with status ${response.status}.`);
  }
  return response.json() as Promise<unknown>;
}

function isAlertList(value: unknown): value is DashboardAlert[] {
  return Array.isArray(value) && value.every((alert) =>
    typeof alert === 'object'
    && alert !== null
    && typeof alert.id === 'string'
    && typeof alert.title === 'string'
    && typeof alert.detail === 'string'
    && typeof alert.time === 'string'
    && ['critical', 'warning', 'info'].includes(alert.type)
    && ['Review order', 'Review operations'].includes(alert.action));
}

function isActivityList(value: unknown): value is ActivityEvent[] {
  return Array.isArray(value) && value.every((event) =>
    typeof event === 'object'
    && event !== null
    && typeof event.id === 'string'
    && typeof event.title === 'string'
    && typeof event.detail === 'string'
    && typeof event.time === 'string'
    && ['success', 'info', 'neutral'].includes(event.type));
}

export async function fetchDashboardData(
  range: DateRange,
  scenario: DataScenario,
  signal?: AbortSignal,
): Promise<DashboardData> {
  const query = new URLSearchParams({ range: String(range), scenario });
  const [orders, alerts, activity] = await Promise.all([
    getJson(`${apiBaseUrl}/api/orders?${query}`, signal),
    getJson(`${apiBaseUrl}/api/alerts?${query}`, signal),
    getJson(`${apiBaseUrl}/api/activity?${query}`, signal),
  ]);

  const orderIssues = validateOrders(orders);
  if (orderIssues.length) {
    throw new DashboardApiError(`Order data failed validation: ${orderIssues.slice(0, 3).join(' ')}`);
  }
  if (!isAlertList(alerts)) {
    throw new DashboardApiError('Alert data did not match the expected response contract.');
  }
  if (!isActivityList(activity)) {
    throw new DashboardApiError('Activity data did not match the expected response contract.');
  }

  return {
    orders: parseOrders(orders),
    alerts,
    activity,
    refreshedAt: new Date().toISOString(),
  };
}
