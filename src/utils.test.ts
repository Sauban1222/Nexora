import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  csvEscape,
  isValidRange,
  percentChange,
  summarizeOrders,
  validateOrders,
} from './utils.ts';
import type { Order } from './types.ts';

const current: Order[] = [
  { id: 'NX-1', customer: 'Northstar', item: 'Boxes', date: '2026-05-01', amount: 100, status: 'Completed' },
  { id: 'NX-2', customer: 'Northstar', item: 'Tape', date: '2026-05-02', amount: 50, status: 'Cancelled' },
  { id: 'NX-3', customer: 'Atlas', item: 'Labels', date: '2026-05-03', amount: 50, status: 'Processing' },
];
const previous: Order[] = [
  { id: 'NX-4', customer: 'Atlas', item: 'Labels', date: '2026-04-24', amount: 100, status: 'Completed' },
  { id: 'NX-5', customer: 'Cedar', item: 'Tape', date: '2026-04-25', amount: 50, status: 'Pending' },
];

test('validates supported dashboard periods', () => {
  for (const value of [7, 30, 90, '7']) assert.equal(isValidRange(value), true);
  for (const value of [0, 14, 365, '', '7 days']) assert.equal(isValidRange(value), false);
});

test('validates records and reports malformed, duplicate, or invalid values', () => {
  assert.deepEqual(validateOrders(current), []);
  assert.deepEqual(validateOrders([]), []);
  assert.deepEqual(validateOrders(null), ['Order data must be a list.']);
  const issues = validateOrders([
    { ...current[0], amount: -1 },
    { ...current[0], id: 'NX-1', status: 'Unknown', date: '2026-02-30' },
    null,
  ]);
  assert.ok(issues.some((issue) => issue.includes('invalid amount')));
  assert.ok(issues.some((issue) => issue.includes('duplicate reference ID')));
  assert.ok(issues.some((issue) => issue.includes('invalid status')));
  assert.ok(issues.some((issue) => issue.includes('invalid date')));
  assert.ok(issues.some((issue) => issue.includes('must be a record')));
});

test('KPI summary uses consistent revenue, counts, distinct accounts, and completion rate', () => {
  const summary = summarizeOrders(current, previous);
  assert.deepEqual({ ...summary, completionRate: 0, completionChange: 0 }, {
    revenue: 150,
    previousRevenue: 150,
    orderCount: 3,
    previousOrderCount: 2,
    activeCustomers: 2,
    previousActiveCustomers: 2,
    completed: 1,
    completionRate: 0,
    completionChange: 0,
  });
  assert.ok(Math.abs(summary.completionRate - 100 / 3) < 1e-10);
  assert.ok(Math.abs(summary.completionChange - (100 / 3 - 50)) < 1e-10);
});

test('percentage change handles growth, decline, and a zero baseline', () => {
  assert.equal(percentChange(150, 100), 50);
  assert.equal(percentChange(50, 100), -50);
  assert.equal(percentChange(0, 0), 0);
  assert.equal(percentChange(10, 0), null);
});

test('CSV escaping preserves quotes, commas, and line breaks', () => {
  assert.equal(csvEscape('Northstar, "East"\nDock'), '"Northstar, ""East""\nDock"');
  assert.equal(csvEscape(null), '""');
});
