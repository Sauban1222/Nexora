import { currency, number, sumRevenue } from '../utils.ts';
import type { DateRange, Order } from '../types.ts';

interface ReportsPageProps {
  current: Order[];
  range: DateRange;
  onExport: () => void;
}

export default function ReportsPage({ current, range, onExport }: ReportsPageProps) {
  const revenue = sumRevenue(current);

  return <>
    <section className="report-hero">
      <span className="report-illustration" aria-hidden="true">CSV</span>
      <div>
        <span className="eyebrow">OPERATIONS SNAPSHOT</span>
        <h2>Your data, ready to take with you.</h2>
        <p>Export a CSV report of orders in the selected {range}-day period. Includes reference, account, item, date, amount, and status.</p>
        <button className="button button-primary" type="button" onClick={onExport}>Download report</button>
      </div>
    </section>
    <div className="report-preview">
      <div><span>REPORT PERIOD</span><strong>Last {range} days</strong></div>
      <div><span>ORDERS INCLUDED</span><strong>{number.format(current.length)}</strong></div>
      <div><span>REVENUE (EXCL. CANCELLED)</span><strong>{currency.format(revenue)}</strong></div>
      <div><span>FILE FORMAT</span><strong>CSV · UTF-8</strong></div>
    </div>
    <p className="report-note">This is an illustrative frontend demo. Exported records are generated sample data and are not connected to a real business.</p>
  </>;
}
