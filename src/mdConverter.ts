export function normalizeMd(input: string): string {
  const lf = input.replace(/\r\n/g, '\n');
  const trimmed = lf.replace(/\n+$/g, '');
  return trimmed + '\n';
}
