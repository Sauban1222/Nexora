import { useEffect, useState } from 'react';
import { fetchDashboardData } from '../api/dashboard-api.ts';
import type { DashboardData, DataScenario, DateRange } from '../types.ts';

export type DashboardLoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: DashboardData };

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'An unexpected error occurred while loading dashboard data.';
}

export function useDashboardData(
  range: DateRange,
  scenario: DataScenario,
  refreshKey: number,
): DashboardLoadState {
  const [state, setState] = useState<DashboardLoadState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });

    fetchDashboardData(range, scenario, controller.signal)
      .then((data) => setState({ status: 'success', data }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setState({ status: 'error', message: getErrorMessage(error) });
        }
      });

    return () => controller.abort();
  }, [range, scenario, refreshKey]);

  return state;
}
