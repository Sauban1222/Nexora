import { getMockApiResponse } from '../../src/api/mock-responses.ts';

export default async function activity(request: Request): Promise<Response> {
  return getMockApiResponse('activity', new URL(request.url));
}
