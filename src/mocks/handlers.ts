import { http, HttpResponse, delay } from 'msw';
import { activity, alertsSeed, filterOrdersByRange, orders } from '../data.ts';
import { isValidRange } from '../utils.ts';
import type { DataScenario } from '../types.ts';

type ScenarioResult = { scenario: DataScenario; range: number } | { response: Response };

function isDataScenario(value: string): value is DataScenario {
  return value === 'success' || value === 'empty' || value === 'error';
}

function getRequestScenario(url: URL): ScenarioResult {
  const rawRange = url.searchParams.get('range');
  const rawScenario = url.searchParams.get('scenario') ?? 'success';
  if (!isValidRange(rawRange)) {
    return { response: HttpResponse.json({ message: 'Supported ranges are 7, 30, and 90 days.' }, { status: 400 }) };
  }
  if (!isDataScenario(rawScenario)) {
    return { response: HttpResponse.json({ message: 'Unsupported demo response scenario.' }, { status: 400 }) };
  }
  return { scenario: rawScenario, range: Number(rawRange) };
}

function failureResponse(scenario: DataScenario): Response | null {
  return scenario === 'error'
    ? HttpResponse.json({ message: 'Simulated service interruption.' }, { status: 503 })
    : null;
}

export const handlers = [
  http.get('*/api/orders', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const result = getRequestScenario(url);
    if ('response' in result) return result.response;
    const failure = failureResponse(result.scenario);
    if (failure) return failure;
    return HttpResponse.json(result.scenario === 'empty' ? [] : filterOrdersByRange(orders, result.range));
  }),
  http.get('*/api/alerts', async ({ request }) => {
    await delay(300);
    const result = getRequestScenario(new URL(request.url));
    if ('response' in result) return result.response;
    const failure = failureResponse(result.scenario);
    if (failure) return failure;
    return HttpResponse.json(result.scenario === 'empty' ? [] : alertsSeed);
  }),
  http.get('*/api/activity', async ({ request }) => {
    await delay(300);
    const result = getRequestScenario(new URL(request.url));
    if ('response' in result) return result.response;
    const failure = failureResponse(result.scenario);
    if (failure) return failure;
    return HttpResponse.json(result.scenario === 'empty' ? [] : activity);
  }),
];
