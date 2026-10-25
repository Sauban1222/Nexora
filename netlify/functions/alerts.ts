import { getMockApiResponse } from '../../src/api/mock-responses.ts';

export default async function alerts(request: Request): Promise<Response> {
  return getMockApiResponse('alerts', new URL(request.url));
}
