import { activity, alertsSeed, filterOrdersByRange, orders } from '../data.ts';
import { isValidRange } from '../utils.ts';
import type { DataScenario } from '../types.ts';

export type MockResource = 'orders' | 'alerts' | 'activity';

function isDataScenario(value: string): value is DataScenario {
  return value === 'success' || value === 'empty' || value === 'error';
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export function getMockApiResponse(resource: MockResource, url: URL): Response {
  const rawRange = url.searchParams.get('range');
  const rawScenario = url.searchParams.get('scenario') ?? 'success';

  if (!isValidRange(rawRange)) {
    return json({ message: 'Supported ranges are 7, 30, and 90 days.' }, 400);
  }
  if (!isDataScenario(rawScenario)) {
    return json({ message: 'Unsupported demo response scenario.' }, 400);
  }
  if (rawScenario === 'error') {
    return json({ message: 'Simulated service interruption.' }, 503);
  }
  if (rawScenario === 'empty') {
    return json([]);
  }

  const responseData = resource === 'orders'
    ? filterOrdersByRange(orders, rawRange)
    : resource === 'alerts'
      ? alertsSeed
      : activity;
  return json(responseData);
}
