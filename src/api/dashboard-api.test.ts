import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { fetchDashboardData } from './dashboard-api.ts';
import ordersFunction from '../../netlify/functions/orders.ts';
import { handlers } from '../mocks/handlers.ts';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('mock dashboard REST API', () => {
  it('loads validated orders, alerts, and activity from REST endpoints', async () => {
    const dashboard = await fetchDashboardData(30, 'success');

    expect(dashboard.orders.length).toBeGreaterThan(0);
    expect(dashboard.orders.length).toBeLessThan(540);
    expect(dashboard.alerts).toHaveLength(3);
    expect(dashboard.activity).toHaveLength(4);
    expect(Number.isNaN(Date.parse(dashboard.refreshedAt))).toBe(false);
  });

  it('returns empty collections for the empty-data scenario', async () => {
    const dashboard = await fetchDashboardData(7, 'empty');

    expect(dashboard).toMatchObject({ orders: [], alerts: [], activity: [] });
  });

  it('surfaces an HTTP error instead of returning success-shaped fallback data', async () => {
    await expect(fetchDashboardData(90, 'error'))
      .rejects.toThrow('Dashboard request failed with status 503.');
  });

  it('rejects malformed order records returned by an endpoint', async () => {
    server.use(
      http.get('*/api/orders', () => HttpResponse.json([{ id: 'bad', amount: -1 }])),
    );

    await expect(fetchDashboardData(30, 'success'))
      .rejects.toThrow('Order data failed validation:');
  });

  it('rejects unsupported ranges at the mock endpoint', async () => {
    const response = await fetch('http://localhost/api/orders?range=14&scenario=success');

    expect(response.status).toBe(400);
  });

  it('serves the same validated mock data through the Netlify function handler', async () => {
    const response = await ordersFunction(
      new Request('https://nexora-dashboard.netlify.app/api/orders?range=7&scenario=success'),
    );
    const records: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(records)).toBe(true);
    expect(records).toHaveLength(20);
    expect(response.headers.get('content-type')).toContain('application/json');
  });
});
