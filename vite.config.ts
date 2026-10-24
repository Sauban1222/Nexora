import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import type { Connect, Plugin } from 'vite';
import { orders, alertsSeed, activity, filterOrdersByRange } from './src/data.ts';
import { isValidRange } from './src/utils.ts';

function mockApiMiddleware(): Connect.NextHandleFunction {
  return (request, response, next) => {
    if (request.method !== 'GET' || !request.url) {
      next();
      return;
    }

    const url = new URL(request.url, 'http://localhost');
    const endpoint = url.pathname;
    if (!['/api/orders', '/api/alerts', '/api/activity'].includes(endpoint)) {
      next();
      return;
    }

    const rawRange = url.searchParams.get('range');
    const scenario = url.searchParams.get('scenario') ?? 'success';
    if (!isValidRange(rawRange)) {
      response.statusCode = 400;
      response.end(JSON.stringify({ message: 'Supported ranges are 7, 30, and 90 days.' }));
      return;
    }
    if (!['success', 'empty', 'error'].includes(scenario)) {
      response.statusCode = 400;
      response.end(JSON.stringify({ message: 'Unsupported demo response scenario.' }));
      return;
    }
    if (scenario === 'error') {
      response.statusCode = 503;
      response.end(JSON.stringify({ message: 'Simulated service interruption.' }));
      return;
    }

    const body = scenario === 'empty'
      ? []
      : endpoint === '/api/orders'
        ? filterOrdersByRange(orders, rawRange)
        : endpoint === '/api/alerts'
          ? alertsSeed
          : activity;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify(body));
  };
}

function productionMockApi(): Plugin {
  return {
    name: 'nexora-production-mock-api',
    configurePreviewServer(server) {
      server.middlewares.use(mockApiMiddleware());
    },
  };
}

export default defineConfig({
  plugins: [react(), productionMockApi()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
