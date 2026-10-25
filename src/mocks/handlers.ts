import { http, delay } from 'msw';
import { getMockApiResponse } from '../api/mock-responses.ts';

export const handlers = [
  http.get('*/api/orders', async ({ request }) => {
    await delay(300);
    return getMockApiResponse('orders', new URL(request.url));
  }),
  http.get('*/api/alerts', async ({ request }) => {
    await delay(300);
    return getMockApiResponse('alerts', new URL(request.url));
  }),
  http.get('*/api/activity', async ({ request }) => {
    await delay(300);
    return getMockApiResponse('activity', new URL(request.url));
  }),
];
