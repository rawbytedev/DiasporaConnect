export function fmtNum(val: unknown, decimals = 2): string {
  const n = Number(val);
  return (isNaN(n) ? 0 : n).toFixed(decimals);
}
