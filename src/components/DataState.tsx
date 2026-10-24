import type { ReactNode } from 'react';

interface DataStateProps {
  status: 'loading' | 'error' | 'success';
  error?: string;
  empty?: boolean;
  pageHeader?: ReactNode;
  onRetry: () => void;
  onUseDemoData: () => void;
  children: ReactNode;
}

export function DataState({
  status,
  error,
  empty = false,
  pageHeader,
  onRetry,
  onUseDemoData,
  children,
}: DataStateProps) {
  if (status === 'loading') {
    return <>
      {pageHeader}
      <div className="data-state-panel" role="status" aria-live="polite">
        <span className="data-state-spinner" aria-hidden="true" />
        <strong>Loading dashboard data</strong>
        <p>Fetching the selected simulated REST response.</p>
      </div>
    </>;
  }

  if (status === 'error') {
    return <>
      {pageHeader}
      <section className="data-state-panel data-state-error" role="alert" aria-live="assertive">
        <strong>Dashboard data could not be loaded</strong>
        <p>{error || 'The mock service returned an unexpected error.'}</p>
        <div className="data-state-actions">
          <button className="button button-primary" type="button" onClick={onRetry}>Try again</button>
          <button className="text-button" type="button" onClick={onUseDemoData}>Switch to successful demo data</button>
        </div>
      </section>
    </>;
  }

  if (empty) {
    return <>
      {pageHeader}
      <section className="data-state-panel" role="status">
        <strong>No records returned</strong>
        <p>The selected mock REST scenario returned an empty dataset.</p>
        <button className="button button-secondary" type="button" onClick={onUseDemoData}>Restore sample records</button>
      </section>
    </>;
  }

  return <div className="data-state-success" aria-busy="false">{children}</div>;
}
