export type Order = { id: number; cents: number; currency: string | null };
export const oldOrders: Order[] = [
  { id: 1042, cents: 6200, currency: null }, { id: 1043, cents: 1800, currency: null },
  { id: 1044, cents: 4500, currency: null }, { id: 1045, cents: 3200, currency: null },
  { id: 1046, cents: 9100, currency: null }, { id: 1047, cents: 2700, currency: null },
];
export function nextBatch(rows: Order[], size = 2) {
  const ids = rows.filter(row => row.currency === null).slice(0, size).map(row => row.id);
  return rows.map(row => ids.includes(row.id) ? { ...row, currency: 'USD' } : { ...row });
}
export const countMissing = (rows: Order[]) => rows.filter(row => row.currency === null).length;
export type Schema = 'original' | 'expanded' | 'required';
export type Board = {
  schema: Schema;
  app: 'old' | 'new' | 'mixed';
  rows: Order[];
  result: string;
  tone?: 'ok' | 'warn' | 'fail';
  query?: string;
  revision?: string;
  changed?: boolean;
};
export const rollout = [
  { label: 'Start', schema: 'original', app: 'old', rows: oldOrders.slice(0, 2), result: 'Old app works. Both orders are understood to be USD.', tone: 'ok', revision: '001' },
  { label: 'Expand', schema: 'expanded', app: 'old', rows: oldOrders.slice(0, 2), result: 'Column added. New inserts get USD from the database default; historical rows remain empty.', tone: 'ok', revision: '002', changed: true },
  { label: 'Roll out', schema: 'expanded', app: 'mixed', rows: oldOrders.slice(0, 2), result: 'Old and new versions coexist. New readers use USD when historical currency is empty. New writers explicitly send USD.', tone: 'ok', revision: '002' },
  { label: 'Backfill', schema: 'expanded', app: 'mixed', rows: nextBatch(oldOrders.slice(0, 2)), result: 'Historical rows now have currency. Both application versions still work for USD orders.', tone: 'ok', revision: '002', changed: true },
  { label: 'Require it', schema: 'required', app: 'new', rows: nextBatch(oldOrders.slice(0, 2)), result: 'Validate existing rows, then require currency. Retire old readers before enabling other currencies.', tone: 'ok', revision: '003', changed: true },
] satisfies (Board & { label: string })[];
export const badRollout: Board = {
  schema: 'original', app: 'new', rows: oldOrders.slice(0, 2), tone: 'fail', revision: '001',
  result: 'New code reaches a database without currency. The query fails: column "currency" does not exist.',
};
