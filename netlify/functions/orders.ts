import { getMockApiResponse } from '../../src/api/mock-responses.ts';

export default async function orders(request: Request): Promise<Response> {
  return getMockApiResponse('orders', new URL(request.url));
}
