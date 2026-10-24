import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  aggregateByDay,
  filterOrdersByRange,
  getRangeStart,
  orders,
  statusCounts,
} from './data.ts';
import type { Order } from './types.ts';

const end = new Date('2026-05-07T12:00:00.000Z');
const records: Order[] = [
  { id: 'NX-1', customer: 'Northstar', item: 'Boxes', date: '2026-05-01', amount: 100, status: 'Completed' },
  { id: 'NX-2', customer: 'Northstar', item: 'Tape', date: '2026-05-07', amount: 50, status: 'Cancelled' },
  { id: 'NX-3', customer: 'Atlas', item: 'Labels', date: '2026-04-30', amount: 25, status: 'Delayed' },
  { id: 'NX-4', customer: 'Atlas', item: 'Labels', date: '2026-05-08', amount: 75, status: 'Pending' },
];

test('generated sample data has valid records and unique IDs', () => {
  assert.equal(orders.length, 540);
  assert.equal(new Set(orders.map((order) => order.id)).size, orders.length);
  assert.ok(orders.every((order) => Number.isFinite(order.amount) && order.amount >= 0));
});

test('period start is inclusive and invalid ranges are rejected', () => {
  assert.equal(getRangeStart(7, end).toISOString(), '2026-05-01T12:00:00.000Z');
  assert.deepEqual(filterOrdersByRange(records, 7, end).map((order) => order.id), ['NX-1', 'NX-2']);
  assert.throws(() => getRangeStart(14, end), RangeError);
  assert.throws(() => getRangeStart(7, new Date('invalid')), TypeError);
});

test('daily aggregation keeps empty dates and excludes cancelled revenue', () => {
  const days = aggregateByDay(records, 7, end);
  assert.equal(days.length, 7);
  assert.equal(days[0].date.toISOString().slice(0, 10), '2026-05-01');
  assert.equal(days[0].revenue, 100);
  assert.equal(days[0].orders, 1);
  assert.equal(days[1].orders, 0);
  assert.equal(days[6].revenue, 0);
  assert.equal(days[6].orders, 1);
  assert.equal(days[6].active, 1);
});

test('status distribution includes every status exactly once', () => {
  assert.deepEqual(statusCounts(records), [
    { status: 'Completed', count: 1 },
    { status: 'Processing', count: 0 },
    { status: 'Pending', count: 1 },
    { status: 'Delayed', count: 1 },
    { status: 'Cancelled', count: 1 },
  ]);
});
