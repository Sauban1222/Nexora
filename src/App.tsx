import {
  useCallback,
  useEffect,
  lazy,
  useMemo,
  useRef,
  useState,
  Suspense,
  type ButtonHTMLAttributes,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import {
  aggregateByDay,
  filterOrdersByRange,
  getPreviousPeriod,
  statusCounts,
} from './data.ts';
import {
  currency,
  formatDate,
  isValidRange,
  number,
  ORDER_STATUSES,
  percentChange,
  csvEscape,
  summarizeOrders,
  sumRevenue,
} from './utils.ts';
import { DataState } from './components/DataState.tsx';
import { useDashboardData } from './hooks/useDashboardData.ts';
import type {
  ActivityEvent,
  DashboardAlert,
  DashboardPage,
  DataScenario,
  DailyAggregate,
  DateRange,
  Order,
  OrderStatus,
  StatusCount,
} from './types.ts';

const NAV: { name: DashboardPage; icon: IconName; group: 'Workspace' | 'Manage'; badge?: number }[] = [
  { name: 'Overview', icon: 'grid', group: 'Workspace' },
  { name: 'Analytics', icon: 'chart', group: 'Workspace' },
  { name: 'Orders', icon: 'box', group: 'Workspace' },
  { name: 'Customers', icon: 'users', group: 'Workspace' },
  { name: 'Operations', icon: 'activity', group: 'Manage' },
  { name: 'Reports', icon: 'file', group: 'Manage' },
  { name: 'Settings', icon: 'settings', group: 'Manage' },
];

const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
];

const ICON_PATHS = {
  grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
  chart: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 15 4-4 3 2 5-6" /><path d="M16 7h3v3" /></>,
  box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.8 7.5 4.4 7.5-4.4M12 21v-8.8" /></>,
  users: <><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" /><circle cx="9.5" cy="7" r="4" /><path d="M17 11a4 4 0 0 0 0-8m4 17v-1.5a4 4 0 0 0-3-3.9" /></>,
  activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
  file: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" /><path d="M14 3v6h6M8 13h8M8 17h8" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.1.9-1.4 2.4-1.4-.5a8 8 0 0 1-1.5.9l-.3 1.5h-2.8l-.3-1.5a8 8 0 0 1-1.5-.9l-1.4.5-1.4-2.4 1.1-.9a7 7 0 0 1 0-1.8l-1.1-.9 1.4-2.4 1.4.5a8 8 0 0 1 1.5-.9l.3-1.5h2.8l.3 1.5a8 8 0 0 1 1.5.9l1.4-.5 1.4 2.4-1.1.9a7 7 0 0 1 0 1.8Z" transform="translate(-1 -1)" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  chevron: <path d="m7 10 5 5 5-5" />,
  download: <><path d="M12 3v12m-5-5 5 5 5-5" /><path d="M5 17v4h14v-4" /></>,
  refresh: <><path d="M20 7v5h-5" /><path d="M4.7 9A8 8 0 0 1 18 5l2 2M4 17v-5h5" /><path d="M19.3 15A8 8 0 0 1 6 19l-2-2" /></>,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
  arrowUp: <><path d="m7 14 5-5 5 5" /></>,
  arrowDown: <><path d="m7 10 5 5 5-5" /></>,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  alert: <><path d="m10.3 3.9-8 14a2 2 0 0 0 1.8 3h15.8a2 2 0 0 0 1.8-3l-8-14a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 4h.01" /></>,
  package: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="M3 8v9l9 5 9-5V8M12 13v9" /></>,
  spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z" /><path d="m19 14 1 2.5 2.5 1-2.5 1L19 21l-1-2.5-2.5-1 2.5-1L19 14Z" /></>,
  trend: <><path d="m3 17 6-6 4 4 8-9" /><path d="M15 6h6v6" /></>,
};

type IconName = keyof typeof ICON_PATHS;
type OrderFilter = OrderStatus | 'All statuses';
type OrderSortKey = keyof Order;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

interface SidebarProps {
  page: DashboardPage;
  setPage: Dispatch<SetStateAction<DashboardPage>>;
  mobileOpen: boolean;
  closeMobile: () => void;
}

interface HeaderProps {
  page: DashboardPage;
  range: DateRange;
  setRange: (value: string) => void;
  search: string;
  setSearch: (value: string) => void;
  openMobile: () => void;
  notificationOpen: boolean;
  setNotificationOpen: Dispatch<SetStateAction<boolean>>;
  alerts: DashboardAlert[];
}

interface PageHeaderProps {
  page: DashboardPage;
  range?: DateRange;
  setRange?: (value: string) => void;
  onExport?: () => void;
  onRefresh?: () => void;
  loading?: boolean;
  lastUpdated?: string;
}

interface OrderTableProps {
  records: Order[];
  statusFilter: OrderFilter;
  setStatusFilter: (value: string) => void;
  search: string;
  setSearch: (value: string) => void;
  loading: boolean;
  allCount: number;
  resetFilters: () => void;
  onAlert: (message: string) => void;
}

interface AlertsPanelProps {
  alerts: DashboardAlert[];
  dismiss: (id: string) => void;
  onAction: (alert: DashboardAlert) => void;
}

function Icon({ name, size = 18, className = '' }: IconProps) {
  return <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{ICON_PATHS[name] || ICON_PATHS.spark}</svg>;
}

function Button({
  children,
  variant = 'secondary',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary'; className?: string }) {
  return <button type={type} className={`button button-${variant} ${className}`} {...props}>{children}</button>;
}

function Sidebar({ page, setPage, mobileOpen, closeMobile }: SidebarProps) {
  const sidebarRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousFocus = document.activeElement;
    const focusable = () => [...(sidebarRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])];
    const first = focusable()[0];
    first?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMobile();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      if (event.shiftKey && document.activeElement === items[0]) {
        event.preventDefault();
        items[items.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === items[items.length - 1]) {
        event.preventDefault();
        items[0].focus();
      }
    };
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = oldOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [mobileOpen, closeMobile]);
  const groups = ['Workspace', 'Manage'];
  return <>
    {mobileOpen && <button className="drawer-backdrop" aria-label="Close navigation" onClick={closeMobile} />}
    <aside ref={sidebarRef} className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`} aria-label="Main navigation" aria-modal={mobileOpen ? 'true' : undefined} role={mobileOpen ? 'dialog' : undefined}>
      <a className="brand" href="#overview" onClick={(event) => { event.preventDefault(); setPage('Overview'); closeMobile(); }}>
        <span className="brand-mark"><Icon name="spark" size={19} /></span>
        <span className="brand-word">nexora<span>.</span><small>OPERATIONS CLOUD</small></span>
      </a>
      <div className="workspace-switch">
        <span className="workspace-avatar">A</span>
        <span className="workspace-copy"><strong>Acme Studio</strong><small>Business workspace</small></span>
        <Icon name="chevron" size={15} />
      </div>
      <nav className="side-nav">
        {groups.map((group) => <div className="nav-group" key={group}>
          <p className="nav-label">{group}</p>
          {NAV.filter((item) => item.group === group).map((item) => <button
            key={item.name}
            className={`nav-link ${page === item.name ? 'nav-link-active' : ''}`}
            aria-current={page === item.name ? 'page' : undefined}
            onClick={() => { setPage(item.name); closeMobile(); }}
          >
            <Icon name={item.icon} size={18} />
            <span>{item.name}</span>
            {item.badge && <span className="nav-count">{item.badge}</span>}
          </button>)}
        </div>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="plan-card">
          <div className="plan-heading"><span className="plan-icon"><Icon name="spark" size={15} /></span><strong>Demo workspace</strong></div>
          <p>Explore with illustrative records.</p>
          <span className="demo-status"><i /> Sample data only</span>
        </div>
        <button className="profile-switch" onClick={() => { setPage('Settings'); closeMobile(); }} aria-label="Open profile settings">
          <span className="profile-avatar">JD</span>
          <span className="profile-copy"><strong>Jordan Davis</strong><small>Operations lead</small></span>
          <Icon name="more" size={18} />
        </button>
      </div>
    </aside>
  </>;
}

function Header({
  page,
  range,
  setRange,
  search,
  setSearch,
  openMobile,
  notificationOpen,
  setNotificationOpen,
  alerts,
}: HeaderProps) {
  const searchShortcut = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K';
  const notificationRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!notificationOpen) return undefined;
    const previousFocus = document.activeElement;
    notificationRef.current?.querySelector('button')?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotificationOpen(false);
        previousFocus instanceof HTMLElement && previousFocus.focus();
      } else if (event.key === 'Tab' && notificationRef.current) {
        const focusable = [...notificationRef.current.querySelectorAll<HTMLButtonElement>('button:not([disabled])')];
        if (focusable.length && (event.shiftKey && document.activeElement === focusable[0]
          || !event.shiftKey && document.activeElement === focusable[focusable.length - 1])) {
          event.preventDefault();
          focusable[event.shiftKey ? focusable.length - 1 : 0].focus();
        }
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      if (!notificationRef.current?.contains(event.target)
        && !event.target.closest('.notification-button')) setNotificationOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [notificationOpen, setNotificationOpen]);
  return <header className="topbar">
    <div className="topbar-left">
      <button className="icon-button mobile-menu" onClick={openMobile} aria-label="Open navigation menu"><span className="menu-lines" /></button>
      <div className="breadcrumbs"><span>Workspace</span><span className="crumb-divider">/</span><strong>{page}</strong></div>
    </div>
    <div className="topbar-actions">
      <label className="global-search">
        <Icon name="search" size={17} />
        <span className="sr-only">Search orders</span>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search orders..." />
        <kbd>{searchShortcut}</kbd>
      </label>
      <div className="notification-wrap">
        <button className="icon-button notification-button" aria-label={`Notifications, ${alerts.length} active alerts`} aria-expanded={notificationOpen} onClick={() => setNotificationOpen(!notificationOpen)}>
          <Icon name="bell" size={18} />{alerts.length > 0 && <span className="notification-dot" />}
        </button>
        {notificationOpen && <div ref={notificationRef} className="notification-popover" role="dialog" aria-label="Notifications">
          <div className="popover-heading"><div><strong>Notifications</strong><span>{alerts.length} active alerts</span></div><button className="text-button" onClick={() => { setNotificationOpen(false); document.querySelector<HTMLButtonElement>('[aria-label^="Notifications,"]')?.focus(); }}>Close</button></div>
          {alerts.map((alert) => <div className="popover-item" key={alert.id}><span className={`alert-dot dot-${alert.type}`} /><span><strong>{alert.title}</strong><small>{alert.detail}</small></span></div>)}
          {!alerts.length && <p className="popover-empty">You’re all caught up.</p>}
        </div>}
      </div>
      <span className="topbar-divider" />
      <div className="top-profile"><span className="profile-avatar">JD</span><span><strong>Jordan Davis</strong><small>Admin</small></span><Icon name="chevron" size={14} /></div>
    </div>
    {page !== 'Settings' && <div className="mobile-range">
      <label className="sr-only" htmlFor="mobile-range">Date range</label>
      <select id="mobile-range" value={range} onChange={(event) => setRange(event.target.value)}>
        {RANGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>}
  </header>;
}

function PageHeader({ page, range, setRange, onExport, onRefresh, loading, lastUpdated }: PageHeaderProps) {
  const descriptions: Record<DashboardPage, string> = {
    Overview: 'Monitor performance, track operational health, and spot important changes.',
    Analytics: 'A closer look at the trends shaping your business.',
    Orders: 'Track, search, and manage every customer order.',
    Customers: 'Understand the accounts behind your order activity.',
    Operations: 'Monitor fulfillment health and the work in progress.',
    Reports: 'Export a clear snapshot of your operational activity.',
    Settings: 'Make this workspace work the way you do.',
  };
  return <div className="page-heading">
    <div>
      <div className="eyebrow"><span className="eyebrow-dot" /> NEXORA WORKSPACE <span className="eyebrow-divider">·</span> SIMULATED DATA</div>
      <h1>{page === 'Overview' ? 'Operations Overview' : page}</h1>
      <p>{descriptions[page]}</p>
    </div>
    <div className="heading-actions">
      {setRange && page !== 'Settings' && <label className="range-control desktop-range"><span className="sr-only">Dashboard date range</span><Icon name="clock" size={16} /><select value={range} onChange={(event) => setRange(event.target.value)}>{RANGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><Icon name="chevron" size={14} /></label>}
      {page === 'Overview' && lastUpdated && <span className="updated-label">Updated {lastUpdated}</span>}
      {page === 'Overview' && <Button onClick={onExport}><Icon name="download" size={16} /><span>Export</span></Button>}
      {page === 'Overview' && <Button variant="primary" onClick={onRefresh} disabled={loading}><Icon name="refresh" size={16} className={loading ? 'spin' : ''} /><span>{loading ? 'Refreshing' : 'Refresh'}</span></Button>}
    </div>
  </div>;
}

function Sparkline({ values, change }: { values: number[]; change: number | null }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${28 - ((value - min) / (max - min || 1)) * 24}`).join(' ');
  const tone = change === null ? 'neutral' : change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
  return <svg className={`sparkline spark-${tone}`} viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function KpiCard({
  title,
  value,
  change,
  icon,
  footnote,
  spark,
  changeSuffix = '%',
}: {
  title: string;
  value: string;
  change: number | null;
  icon: IconName;
  footnote: string;
  spark: number[];
  changeSuffix?: string;
}) {
  const positive = change !== null && change > 0;
  const negative = change !== null && change < 0;
  const changeLabel = change === null ? 'New' : Math.abs(change).toFixed(1);
  const tone = change === null || change === 0 ? 'flat' : positive ? 'up' : 'down';
  return <article className="kpi-card">
    <div className="kpi-top"><span>{title}</span><span className="kpi-icon"><Icon name={icon} size={17} /></span></div>
    <div className="kpi-value">{value}</div>
    <div className="kpi-bottom">
      <span className={`change-pill change-${tone}`}>{(positive || negative) && <Icon name={positive ? 'arrowUp' : 'arrowDown'} size={13} />}{changeLabel}{change === null ? '' : changeSuffix}</span>
      <span className="kpi-period">vs previous period</span>
      <Sparkline values={spark} change={change} />
    </div>
    <span className="kpi-footnote">{footnote}</span>
  </article>;
}

function TrendChart({
  data,
  metric = 'revenue',
  detailed = false,
}: {
  data: DailyAggregate[];
  metric?: 'revenue' | 'orders';
  detailed?: boolean;
}) {
  const w = 720;
  const h = detailed ? 275 : 220;
  const pad = { top: 16, right: 14, bottom: 32, left: 54 };
  const values = data.map((item) => item[metric]);
  const max = Math.max(...values, 1);
  const ceil = metric === 'revenue' ? Math.ceil(max / (max > 10000 ? 5000 : max > 3000 ? 1000 : 250)) * (max > 10000 ? 5000 : max > 3000 ? 1000 : 250) : Math.ceil(max / 5) * 5 || 5;
  const x = (index: number) => pad.left + (index / Math.max(data.length - 1, 1)) * (w - pad.left - pad.right);
  const y = (value: number) => pad.top + (1 - value / ceil) * (h - pad.top - pad.bottom);
  const points = data.map((item, index) => `${x(index)},${y(item[metric])}`).join(' ');
  const area = `${pad.left},${h - pad.bottom} ${points} ${w - pad.right},${h - pad.bottom}`;
  const ticks = 4;
  const labelIndexes = data.length <= 7 ? data.map((_, index) => index) : [0, Math.floor((data.length - 1) / 3), Math.floor((data.length - 1) * 2 / 3), data.length - 1];
  return <div className="chart-svg-wrap">
    <svg className="trend-svg" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${metric === 'revenue' ? 'Revenue' : 'Orders'} trend over ${data.length} days`}>
      <defs><linearGradient id={`chart-fill-${metric}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={metric === 'revenue' ? '#5268e8' : '#24a68a'} stopOpacity=".17" /><stop offset="100%" stopColor={metric === 'revenue' ? '#5268e8' : '#24a68a'} stopOpacity="0" /></linearGradient></defs>
      {Array.from({ length: ticks + 1 }, (_, index) => {
        const value = ceil * index / ticks;
        const yy = y(value);
        return <g key={index}><line x1={pad.left} y1={yy} x2={w - pad.right} y2={yy} className="chart-gridline" /><text x={pad.left - 10} y={yy + 4} textAnchor="end" className="chart-y-label">{metric === 'revenue' ? (value === 0 ? '$0' : `$${number.format(value / 1000)}${value >= 1000 ? 'k' : ''}`) : number.format(value)}</text></g>;
      })}
      <polygon points={area} fill={`url(#chart-fill-${metric})`} />
      <polyline points={points} fill="none" stroke={metric === 'revenue' ? '#5268e8' : '#24a68a'} strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((item, index) => <circle key={item.date.toISOString()} cx={x(index)} cy={y(item[metric])} r={data.length <= 7 ? 4 : 2.2} fill="white" stroke={metric === 'revenue' ? '#5268e8' : '#24a68a'} strokeWidth="2"><title>{formatDate(item.date.toISOString().slice(0, 10), { month: 'long', day: 'numeric' })}: {metric === 'revenue' ? currency.format(item.revenue) : `${item.orders} orders`}</title></circle>)}
      {labelIndexes.map((index) => <text key={index} x={x(index)} y={h - 8} textAnchor={index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle'} className="chart-x-label">{formatDate(data[index].date.toISOString().slice(0, 10), { month: 'short', day: 'numeric' })}</text>)}
    </svg>
  </div>;
}

const STATUS_COLORS = { Completed: '#24a68a', Processing: '#6575eb', Pending: '#e6a344', Delayed: '#e26f63', Cancelled: '#aeb7c6' };

function StatusChart({ counts }: { counts: StatusCount[] }) {
  const total = counts.reduce((sum, item) => sum + item.count, 0);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return <div className="status-layout">
    <div className="donut-wrap">
      <svg viewBox="0 0 120 120" role="img" aria-label={`Order status distribution: ${counts.map((item) => `${item.count} ${item.status}`).join(', ')}`}>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#eef1f6" strokeWidth="12" />
        {counts.map(({ status, count }) => {
          const length = total ? (count / total) * circumference : 0;
          const segment = <circle key={status} cx="60" cy="60" r={radius} fill="none" stroke={STATUS_COLORS[status]} strokeWidth="12" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} transform="rotate(-90 60 60)" />;
          offset += length;
          return segment;
        })}
        <text x="60" y="57" textAnchor="middle" className="donut-total">{number.format(total)}</text><text x="60" y="74" textAnchor="middle" className="donut-caption">orders</text>
      </svg>
    </div>
    <div className="status-legend">{counts.map((item) => <div className="legend-row" key={item.status}><span className="legend-name"><i style={{ backgroundColor: STATUS_COLORS[item.status] }} />{item.status}</span><strong>{number.format(item.count)} <small>{total ? Math.round(item.count / total * 100) : 0}%</small></strong></div>)}</div>
  </div>;
}

function Panel({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return <section className={`panel ${className}`}><div className="panel-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>;
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}><i />{status}</span>;
}

function OrdersTable({
  records,
  statusFilter,
  setStatusFilter,
  search,
  setSearch,
  loading,
  allCount,
  resetFilters,
  onAlert,
}: OrderTableProps) {
  const [sort, setSort] = useState<{ key: OrderSortKey; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return records.filter((record) => (statusFilter === 'All statuses' || record.status === statusFilter)
      && (!query || [record.id, record.customer, record.item, record.status].some((value) => value.toLocaleLowerCase().includes(query))));
  }, [records, search, statusFilter]);
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const left = a[sort.key];
    const right = b[sort.key];
    const result = typeof left === 'number' && typeof right === 'number'
      ? left - right
      : String(left).localeCompare(String(right));
    return result * (sort.direction === 'asc' ? 1 : -1);
  }), [filtered, sort]);
  const pages = Math.ceil(sorted.length / pageSize);
  const currentPage = Math.min(page, Math.max(pages, 1));
  const visible = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => setPage(1), [search, statusFilter, records]);
  const changeSort = (key: OrderSortKey) => {
    setSort((current) => ({ key, direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc' }));
    setPage(1);
  };
  const sortHeading = (label: string, key: OrderSortKey) => <button type="button" className="sort-button" onClick={() => changeSort(key)} aria-label={`Sort by ${label}${sort.key === key ? `, currently ${sort.direction === 'asc' ? 'ascending' : 'descending'}` : ''}`}>
    {label}<Icon name={sort.key === key ? (sort.direction === 'asc' ? 'arrowUp' : 'arrowDown') : 'arrowDown'} size={13} className={sort.key === key ? 'sort-active' : ''} />
  </button>;
  const sortableHeader = (label: string, key: OrderSortKey) => <th aria-sort={sort.key === key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>{sortHeading(label, key)}</th>;
  return <Panel className="table-panel" title="Recent orders" subtitle={`${number.format(filtered.length)} of ${number.format(allCount)} orders`} action={<button className="text-button table-view-all" onClick={() => document.querySelector<HTMLInputElement>('#orders-search')?.focus()}>Search orders <Icon name="search" size={14} /></button>}>
    <div className="table-toolbar">
      <label className="table-search"><Icon name="search" size={16} /><span className="sr-only">Search orders by customer, item or ID</span><input id="orders-search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search orders..." /></label>
      <label className="status-select"><span className="sr-only">Filter by order status</span><select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}><option>All statuses</option>{['Completed', 'Processing', 'Pending', 'Delayed', 'Cancelled'].map((status) => <option key={status}>{status}</option>)}</select><Icon name="chevron" size={14} /></label>
      {(statusFilter !== 'All statuses' || search) && <button className="clear-filters" onClick={() => { resetFilters(); setPage(1); }}>Clear filters <Icon name="close" size={13} /></button>}
    </div>
    {loading ? <div className="table-loading" aria-label="Loading orders"><span /><span /><span /><span /></div> : visible.length ? <>
      <div className="table-scroll"><table><caption className="sr-only">Orders for the selected reporting period</caption><thead><tr>{sortableHeader('Order', 'id')}{sortableHeader('Customer', 'customer')}<th scope="col">Item</th>{sortableHeader('Date', 'date')}{sortableHeader('Amount', 'amount')}<th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>
        {visible.map((order) => <tr key={order.id}><td><button className="order-id" onClick={() => onAlert(`Order ${order.id} selected.`)}>{order.id}</button></td><td><span className="customer-cell"><span className={`customer-avatar customer-${order.customer.length % 5}`}>{order.customer.split(/[ .&]/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><strong>{order.customer}</strong></span></td><td className="item-cell">{order.item}</td><td className="date-cell">{formatDate(order.date)}</td><td className="amount-cell">{currency.format(order.amount)}</td><td><StatusBadge status={order.status} /></td><td><button className="row-more" aria-label={`More actions for order ${order.id}`} onClick={() => onAlert(`${order.id} · ${order.customer} · ${order.status}`)}><Icon name="more" size={18} /></button></td></tr>)}
      </tbody></table></div>
      <div className="table-footer"><span>Showing <strong>{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sorted.length)}</strong> of <strong>{number.format(sorted.length)}</strong> results</span><div className="pagination"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {Math.max(pages, 1)}</span><button disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Next</button></div></div>
    </> : <div className="empty-state"><span className="empty-icon"><Icon name="search" size={21} /></span><strong>{records.length ? 'No matching orders' : 'No orders in this period'}</strong><p>{records.length ? 'Try another search or clear your filters to see more.' : 'Choose a longer date range to explore more activity.'}</p><button className="text-button" onClick={resetFilters}>Clear filters <span aria-hidden="true">→</span></button></div>}
  </Panel>;
}

function AlertsPanel({ alerts, dismiss, onAction }: AlertsPanelProps) {
  return <Panel className="alerts-panel" title="Needs your attention" subtitle={`${alerts.length} items to review`} action={<span className="attention-count">{alerts.length}</span>}>
    {alerts.length ? <div className="alerts-list">{alerts.map((alert) => <article className={`alert-row alert-${alert.type}`} key={alert.id}>
      <span className="alert-symbol"><Icon name={alert.type === 'critical' ? 'alert' : alert.type === 'warning' ? 'package' : 'clock'} size={16} /></span>
      <div className="alert-body"><strong>{alert.title}</strong><p>{alert.detail}</p><span className="alert-time">{alert.time}</span><button className="alert-action" onClick={() => onAction(alert)}>{alert.action}<span aria-hidden="true"> →</span></button></div>
      <button className="alert-dismiss" aria-label={`Dismiss ${alert.title}`} onClick={() => dismiss(alert.id)}><Icon name="close" size={15} /></button>
    </article>)}</div> : <div className="mini-empty"><span className="success-check"><Icon name="check" size={15} /></span><p>You’re all caught up.<small>No items need your attention right now.</small></p></div>}
  </Panel>;
}

function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return <Panel className="activity-panel" title="Recent activity" subtitle="Illustrative events from this demo" action={<span className="live-label"><i /> SAMPLE</span>}>
    <div className="activity-list">{events.map((event) => <article className="activity-row" key={event.id}><span className={`activity-icon activity-${event.type}`}><Icon name={event.type === 'success' ? 'check' : event.type === 'info' ? 'package' : 'activity'} size={15} /></span><div className="activity-copy"><strong>{event.title}</strong><span>{event.detail}</span></div><time>{event.time}</time></article>)}</div>
  </Panel>;
}

function MetricCards({
  current,
  previous,
  days,
  chart,
}: {
  current: Order[];
  previous: Order[];
  days: DateRange;
  chart: DailyAggregate[];
}) {
  const summary = summarizeOrders(current, previous);
  const revChange = percentChange(summary.revenue, summary.previousRevenue);
  const orderChange = percentChange(summary.orderCount, summary.previousOrderCount);
  const activeChange = percentChange(summary.activeCustomers, summary.previousActiveCustomers);
  const recent = chart.slice(-12);
  const mini = (key: 'revenue' | 'orders' | 'active' | 'completed') => recent.map((item) => item[key]);
  return <section className="kpi-grid" aria-label="Key performance indicators">
    <KpiCard title="Total revenue" value={currency.format(summary.revenue)} change={revChange} icon="trend" footnote="Excludes cancelled orders" spark={mini('revenue')} />
    <KpiCard title="Total orders" value={number.format(summary.orderCount)} change={orderChange} icon="box" footnote={`Across the last ${days} days`} spark={mini('orders')} />
    <KpiCard title="Active customers" value={number.format(summary.activeCustomers)} change={activeChange} icon="users" footnote="Accounts with an order in period" spark={mini('active')} />
    <KpiCard title="Completion rate" value={`${summary.completionRate.toFixed(1)}%`} change={summary.completionChange} changeSuffix=" pp" icon="check" footnote={`${summary.completed} orders completed`} spark={mini('orders').map((orders, index) => orders ? recent[index].completed / orders * 100 : 0)} />
  </section>;
}

function Overview({
  current,
  previous,
  range,
  setRange,
  chart,
  counts,
  alerts,
  dismiss,
  onAction,
  events,
  tableProps,
  onExport,
  onRefresh,
  loading,
  lastUpdated,
  allOrders,
  setPage,
}: {
  current: Order[];
  previous: Order[];
  range: DateRange;
  setRange: (value: string) => void;
  chart: DailyAggregate[];
  counts: StatusCount[];
  alerts: DashboardAlert[];
  dismiss: (id: string) => void;
  onAction: (alert: DashboardAlert) => void;
  events: ActivityEvent[];
  tableProps: Omit<OrderTableProps, 'records' | 'allCount'>;
  onExport: () => void;
  onRefresh: () => void;
  loading: boolean;
  lastUpdated: string;
  allOrders: Order[];
  setPage: Dispatch<SetStateAction<DashboardPage>>;
}) {
  return <>
    <PageHeader page="Overview" range={range} setRange={setRange} onExport={onExport} onRefresh={onRefresh} loading={loading} lastUpdated={lastUpdated} />
    {loading ? <div className="kpi-grid skeleton-grid" aria-label="Refreshing dashboard"><div /><div /><div /><div /></div> : <MetricCards current={current} previous={previous} days={range} chart={chart} />}
    <div className="insights-grid">
      <Panel className="revenue-panel" title="Revenue over time" subtitle="Daily order value, USD" action={<div className="chart-legend"><i /> Revenue</div>}>
        {current.length ? <><div className="chart-summary"><strong>{currency.format(sumRevenue(current))}</strong><span>total revenue in selected period</span></div><TrendChart data={chart} /></> : <div className="chart-empty">No revenue data for this period.</div>}
      </Panel>
      <Panel className="status-panel" title="Order status" subtitle="Current period breakdown" action={<button className="text-button" onClick={() => setPage('Orders')}>View orders <span aria-hidden="true">→</span></button>}>
        {current.length ? <StatusChart counts={counts} /> : <div className="chart-empty">No order status data to show.</div>}
      </Panel>
    </div>
    <div className="bottom-grid">
      <OrdersTable {...tableProps} records={current} allCount={allOrders.length} />
      <div className="right-rail"><AlertsPanel alerts={alerts} dismiss={dismiss} onAction={onAction} /><ActivityFeed events={events} /></div>
    </div>
  </>;
}

function AnalyticsPage({
  chart,
  counts,
  current,
  range,
  setRange,
}: {
  chart: DailyAggregate[];
  counts: StatusCount[];
  current: Order[];
  range: DateRange;
  setRange: (value: string) => void;
}) {
  const billableOrders = current.filter((order) => order.status !== 'Cancelled').length;
  const averageOrderValue = billableOrders ? sumRevenue(current) / billableOrders : 0;
  return <>
    <PageHeader page="Analytics" range={range} setRange={setRange} />
    <section className="analytics-banner"><span className="banner-icon"><Icon name="spark" size={19} /></span><div><strong>A clearer view of the bigger picture.</strong><p>All figures are illustrative and calculated from the orders in the selected {range}-day period.</p></div><span className="sim-tag">DEMO DATA</span></section>
    <div className="analytics-grid">
      <Panel className="analytics-trend-panel" title="Revenue trend" subtitle="Order value by day" action={<span className="chart-legend"><i /> Revenue</span>}>{current.length ? <><div className="chart-summary"><strong>{currency.format(sumRevenue(current))}</strong><span>across {range} days</span></div><TrendChart data={chart} detailed /></> : <div className="chart-empty">No revenue data for this period.</div>}</Panel>
      <Panel title="Orders per day" subtitle="Volume by day" action={<span className="chart-legend chart-legend-teal"><i /> Orders</span>}>{current.length ? <><div className="chart-summary"><strong>{number.format(current.length)}</strong><span>{(current.length / Number(range)).toFixed(1)} average orders per day</span></div><TrendChart data={chart} metric="orders" detailed /></> : <div className="chart-empty">No orders in this period.</div>}</Panel>
      <Panel className="analytics-status" title="Fulfillment mix" subtitle="Status distribution across the selected period"><StatusChart counts={counts} /></Panel>
      <Panel className="insight-card" title="What stands out" subtitle="A quick read of your current operations"><div className="insight-list"><div><span className="insight-index">01</span><p><strong>{current.length ? `${Math.round(current.filter((order) => order.status === 'Completed').length / current.length * 100)}% of orders are complete.` : 'No orders in this period.'}</strong><small>{current.length ? 'Completion rate is based on orders marked Completed.' : 'Try a longer date range to explore trends.'}</small></p></div><div><span className="insight-index">02</span><p><strong>{number.format(new Set(current.map((order) => order.customer)).size)} active customer accounts.</strong><small>Unique accounts with activity in this date range.</small></p></div><div><span className="insight-index">03</span><p><strong>{currency.format(averageOrderValue)} average order value.</strong><small>Revenue divided by non-cancelled orders.</small></p></div></div></Panel>
    </div>
  </>;
}

function CustomersPage({
  current,
  search,
  range,
  setRange,
}: {
  current: Order[];
  search: string;
  range: DateRange;
  setRange: (value: string) => void;
}) {
  const customers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const totals = new Map<string, { name: string; orders: number; spend: number; latest: string }>();
    current.forEach((order) => {
      const existing = totals.get(order.customer) || { name: order.customer, orders: 0, spend: 0, latest: order.date };
      existing.orders += 1;
      if (order.status !== 'Cancelled') existing.spend += order.amount;
      if (order.date > existing.latest) existing.latest = order.date;
      totals.set(order.customer, existing);
    });
    return [...totals.values()].filter((item) => !query || item.name.toLocaleLowerCase().includes(query)).sort((a, b) => b.spend - a.spend);
  }, [current, search]);
  return <>
    <PageHeader page="Customers" range={range} setRange={setRange} />
    <div className="info-strip"><Icon name="users" size={17} /><span>Accounts shown have at least one order in the selected date range.</span><span className="sim-tag">SIMULATED</span></div>
    <Panel className="table-panel customer-panel" title="Active accounts" subtitle={`${customers.length} customers with activity`}><div className="table-scroll"><table><thead><tr><th>Account</th><th>Orders</th><th>Total spend</th><th>Last order</th><th>Relationship</th></tr></thead><tbody>{customers.map((customer) => {
      const relationship = customer.orders >= 8 ? 'Strategic' : customer.orders >= 4 ? 'Growing' : 'Active';
      return <tr key={customer.name}><td><span className="customer-cell"><span className={`customer-avatar customer-${customer.name.length % 5}`}>{customer.name.split(/[ .&]/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><strong>{customer.name}</strong></span></td><td>{customer.orders}</td><td className="amount-cell">{currency.format(customer.spend)}</td><td className="date-cell">{formatDate(customer.latest)}</td><td><span className={`relationship relationship-${relationship.toLowerCase()}`}>{relationship}</span></td></tr>;
    })}</tbody></table></div>{!customers.length && <div className="empty-state"><strong>No active customers found</strong><p>Try another search or date range.</p></div>}</Panel>
  </>;
}

function OperationsPage({
  counts,
  alerts,
  dismiss,
  onAction,
  events,
  current,
  range,
  setRange,
}: {
  counts: StatusCount[];
  alerts: DashboardAlert[];
  dismiss: (id: string) => void;
  onAction: (alert: DashboardAlert) => void;
  events: ActivityEvent[];
  current: Order[];
  range: DateRange;
  setRange: (value: string) => void;
}) {
  const inProgress = current.filter((order) => ['Processing', 'Pending'].includes(order.status)).length;
  const delayed = current.filter((order) => order.status === 'Delayed').length;
  return <>
    <PageHeader page="Operations" range={range} setRange={setRange} />
    <div className="operations-stats"><div><span className="ops-stat-icon ops-green"><Icon name="check" /></span><span><small>Completed</small><strong>{number.format(counts[0]?.count || 0)}</strong></span></div><div><span className="ops-stat-icon ops-blue"><Icon name="activity" /></span><span><small>In progress</small><strong>{number.format(inProgress)}</strong></span></div><div><span className="ops-stat-icon ops-amber"><Icon name="clock" /></span><span><small>Delayed</small><strong>{number.format(delayed)}</strong></span></div><div><span className="ops-stat-icon ops-red"><Icon name="alert" /></span><span><small>Needs review</small><strong>{alerts.length}</strong></span></div></div>
    <div className="operations-grid"><AlertsPanel alerts={alerts} dismiss={dismiss} onAction={onAction} /><Panel title="Status overview" subtitle="Order fulfillment in selected period"><StatusChart counts={counts} /><div className="operations-note"><Icon name="spark" size={15} /><span>Status reflects simulated order records, not a live fulfillment system.</span></div></Panel></div>
    <ActivityFeed events={events} />
  </>;
}

function SettingsPage({
  compact,
  setCompact,
  emailUpdates,
  setEmailUpdates,
  onAlert,
  scenario,
  onScenarioChange,
}: {
  compact: boolean;
  setCompact: Dispatch<SetStateAction<boolean>>;
  emailUpdates: boolean;
  setEmailUpdates: Dispatch<SetStateAction<boolean>>;
  onAlert: (message: string) => void;
  scenario: DataScenario;
  onScenarioChange: (value: string) => void;
}) {
  const Toggle = ({
    checked,
    onChange,
    label,
  }: {
    checked: boolean;
    onChange: (value: boolean) => void;
    label: string;
  }) => <button className={`toggle ${checked ? 'toggle-on' : ''}`} role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}><span /></button>;
  return <>
    <PageHeader page="Settings" />
    <div className="settings-layout"><nav className="settings-nav" aria-label="Settings sections"><a className="settings-nav-active" href="#preferences">Preferences</a><a href="#notifications">Notifications</a><a href="#workspace">Workspace</a></nav>
      <div className="settings-content"><Panel className="settings-panel" title="Workspace preferences" subtitle="Personalize how your overview is presented." ><div id="preferences" className="setting-row"><div><strong>Compact data tables</strong><p>Show more rows with less vertical spacing.</p></div><Toggle checked={compact} onChange={(value) => { setCompact(value); onAlert('Compact table preference updated.'); }} label="Compact data tables" /></div><div id="notifications" className="setting-row"><div><strong>Email activity summary</strong><p>Receive a weekly summary of workspace activity.</p></div><Toggle checked={emailUpdates} onChange={(value) => { setEmailUpdates(value); onAlert('Email activity summary preference updated.'); }} label="Email activity summary" /></div><div className="setting-row setting-static" id="workspace"><div><strong>Workspace name</strong><p>Acme Studio · Business workspace</p></div><span className="read-only-tag">DEMO WORKSPACE</span></div><div className="setting-row setting-static"><div><strong>Data source</strong><p>Generated sample records · intercepted mock REST endpoints</p></div><span className="read-only-tag">ILLUSTRATIVE</span></div><div className="setting-row"><div><strong>Mock API response</strong><p>Switch scenarios to review loading, empty, error, and success states.</p></div><label className="scenario-select"><span className="sr-only">Mock API response scenario</span><select value={scenario} onChange={(event) => onScenarioChange(event.target.value)}><option value="success">Successful data</option><option value="empty">Empty data</option><option value="error">Service error</option></select></label></div></Panel><p className="settings-note">Preferences apply to this preview session only. No personal information or settings are saved.</p></div>
    </div>
  </>;
}

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  if (!message) return null;
  return <div role="status" aria-live="polite" className="toast"><span className="toast-check"><Icon name="check" size={15} /></span>{message}<button onClick={onDismiss} aria-label="Dismiss message"><Icon name="close" size={15} /></button></div>;
}

const ReportsPage = lazy(() => import('./pages/ReportsPage.tsx'));

export default function App() {
  const [page, setPage] = useState<DashboardPage>('Overview');
  const [range, setRange] = useState<DateRange>(30);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderFilter>('All statuses');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [compact, setCompact] = useState(false);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [scenario, setScenario] = useState<DataScenario>('success');
  const [refreshKey, setRefreshKey] = useState(0);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => new Set());
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toastTimer = useRef<number | null>(null);
  const refreshPending = useRef(false);
  const dashboardState = useDashboardData(range, scenario, refreshKey);
  const loading = dashboardState.status === 'loading';
  const orders = dashboardState.status === 'success' ? dashboardState.data.orders : [];
  const activityEvents = dashboardState.status === 'success' ? dashboardState.data.activity : [];
  const alerts = useMemo(() => (dashboardState.status === 'success' ? dashboardState.data.alerts : [])
    .filter((alert) => !dismissedAlerts.has(alert.id)), [dashboardState, dismissedAlerts]);
  const lastUpdated = dashboardState.status === 'success'
    ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(dashboardState.data.refreshedAt))
    : '';
  const safeRange: DateRange = isValidRange(range) ? range : 30;
  const current = useMemo(() => filterOrdersByRange(orders, safeRange), [orders, safeRange]);
  const previous = useMemo(() => getPreviousPeriod(orders, safeRange), [orders, safeRange]);
  const chart = useMemo(() => aggregateByDay(orders, safeRange), [orders, safeRange]);
  const counts = useMemo(() => statusCounts(current), [current]);
  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 4000);
  };
  useEffect(() => () => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
  }, []);
  useEffect(() => {
    if (refreshPending.current && dashboardState.status === 'success') {
      refreshPending.current = false;
      showToast('Dashboard refreshed from the simulated REST endpoints.');
    }
  }, [dashboardState.status, refreshKey]);
  const updateRange = (value: string) => {
    if (!isValidRange(value)) {
      setError('Choose a supported date range: 7, 30, or 90 days.');
      return;
    }
    setRange(value);
    setError('');
  };
  const updateStatusFilter = (value: string) => {
    const validStatus = ORDER_STATUSES.find((status) => status === value);
    if (value !== 'All statuses' && !validStatus) {
      setError('Choose a valid order status or clear the filters.');
      return;
    }
    setStatusFilter(validStatus ?? 'All statuses');
    setError('');
  };
  const refresh = () => {
    setError('');
    refreshPending.current = true;
    setRefreshKey((currentKey) => currentKey + 1);
  };
  const exportReport = () => {
    try {
      const rows = filterOrdersByRange(orders, safeRange).filter((record) => (statusFilter === 'All statuses' || record.status === statusFilter)
        && (!search.trim() || [record.id, record.customer, record.item, record.status].some((value) => value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))));
      const headers = ['Reference ID', 'Customer', 'Item', 'Date', 'Amount (USD)', 'Status'];
      const csv = [headers.map(csvEscape).join(','), ...rows.map((order) => [order.id, order.customer, order.item, order.date, order.amount.toFixed(2), order.status].map(csvEscape).join(','))].join('\r\n');
      const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nexora-operations-${safeRange}d-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`Report exported — ${rows.length} filtered orders.`);
    } catch (exportError: unknown) {
      console.error('Report export failed.', exportError);
      setError('The report could not be exported. Please try again.');
    }
  };
  const resetFilters = () => { setStatusFilter('All statuses'); setSearch(''); };
  const alertAction = (alert: DashboardAlert) => {
    if (alert.action === 'Review order') {
      const orderId = alert.detail.match(/NX-\d+/)?.[0];
      setPage('Orders');
      setStatusFilter('All statuses');
      setSearch(orderId || '');
      return;
    }
    setPage('Operations');
    showToast('Operations view opened. Inventory details are illustrative in this demo.');
  };
  const dismissAlert = (id: string) => {
    setDismissedAlerts((currentAlerts) => new Set(currentAlerts).add(id));
    showToast('Alert dismissed.');
  };
  const updateScenario = (value: string) => {
    if (value !== 'success' && value !== 'empty' && value !== 'error') {
      setError('Choose a supported mock API response scenario.');
      return;
    }
    setScenario(value);
    setError('');
  };
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.querySelector<HTMLInputElement>('.global-search input')?.focus();
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  return <div className={`app-shell ${compact ? 'compact-table' : ''}`}>
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <Sidebar page={page} setPage={setPage} mobileOpen={mobileOpen} closeMobile={closeMobile} />
    <main className="main-area" id="main-content" tabIndex={-1}>
      <Header page={page} range={safeRange} setRange={updateRange} search={search} setSearch={setSearch} openMobile={() => setMobileOpen(true)} notificationOpen={notificationOpen} setNotificationOpen={setNotificationOpen} alerts={alerts} />
      <div className="page-content">
        {error && <div className="error-banner" role="alert"><Icon name="alert" size={17} /><span>{error}</span><button onClick={refresh}>Try again</button><button className="error-close" aria-label="Dismiss error" onClick={() => setError('')}><Icon name="close" size={15} /></button></div>}
        {page === 'Settings' ? <SettingsPage compact={compact} setCompact={setCompact} emailUpdates={emailUpdates} setEmailUpdates={setEmailUpdates} onAlert={showToast} scenario={scenario} onScenarioChange={updateScenario} /> : <DataState
          status={dashboardState.status}
          error={dashboardState.status === 'error' ? dashboardState.message : undefined}
          empty={dashboardState.status === 'success' && orders.length === 0}
          pageHeader={<PageHeader page={page} range={safeRange} setRange={updateRange} onExport={page === 'Overview' ? exportReport : undefined} onRefresh={page === 'Overview' ? refresh : undefined} loading={loading} lastUpdated={lastUpdated} />}
          onRetry={refresh}
          onUseDemoData={() => setScenario('success')}
        >
          {page === 'Overview' && <Overview current={current} previous={previous} range={safeRange} setRange={updateRange} chart={chart} counts={counts} alerts={alerts} dismiss={dismissAlert} onAction={alertAction} events={activityEvents} tableProps={{ statusFilter, setStatusFilter: updateStatusFilter, search, setSearch, loading, resetFilters, onAlert: showToast }} onExport={exportReport} onRefresh={refresh} loading={loading} lastUpdated={lastUpdated} allOrders={current} setPage={setPage} />}
          {page === 'Analytics' && <AnalyticsPage chart={chart} counts={counts} current={current} range={safeRange} setRange={updateRange} />}
          {page === 'Orders' && <><PageHeader page="Orders" range={safeRange} setRange={updateRange} /><OrdersTable records={current} allCount={current.length} statusFilter={statusFilter} setStatusFilter={updateStatusFilter} search={search} setSearch={setSearch} loading={loading} resetFilters={resetFilters} onAlert={showToast} /></>}
          {page === 'Customers' && <CustomersPage current={current} search={search} range={safeRange} setRange={updateRange} />}
          {page === 'Operations' && <OperationsPage counts={counts} alerts={alerts} dismiss={dismissAlert} onAction={alertAction} events={activityEvents} current={current} range={safeRange} setRange={updateRange} />}
          {page === 'Reports' && <Suspense fallback={<div className="data-state-panel" role="status">Loading reports view</div>}><PageHeader page="Reports" range={safeRange} setRange={updateRange} /><ReportsPage current={current} range={safeRange} onExport={exportReport} /></Suspense>}
        </DataState>}
        <footer className="page-footer"><span>© 2026 Nexora, Inc.</span><span><i className="footer-live" /> Demo environment</span><span>Illustrative data · Not connected to a live business</span></footer>
      </div>
    </main>
    <Toast message={toast} onDismiss={() => setToast('')} />
  </div>;
}
