import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import type { Connect, Plugin } from 'vite';
import { getMockApiResponse, type MockResource } from './src/api/mock-responses.ts';

function isMockResource(value: string): value is MockResource {
  return value === 'orders' || value === 'alerts' || value === 'activity';
}

function mockApiMiddleware(): Connect.NextHandleFunction {
  return (request, response, next) => {
    if (request.method !== 'GET' || !request.url) {
      next();
      return;
    }

    const url = new URL(request.url, 'http://localhost');
    const endpoint = url.pathname.replace(/^\/api\//, '');
    if (!isMockResource(endpoint)) {
      next();
      return;
    }

    const mockResponse = getMockApiResponse(endpoint, url);
    response.statusCode = mockResponse.status;
    mockResponse.headers.forEach((value, key) => response.setHeader(key, value));
    void mockResponse.text().then(
      (body) => response.end(body),
      (error: unknown) => next(error),
    );
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
