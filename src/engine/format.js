// "Anastassi Xenos" → "Anastassi X."
export function fmtName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const first = parts[0][0].toUpperCase() + parts[0].slice(1).toLowerCase();
  return `${first} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function fmtDate(dateStr) {
  if (!dateStr) return '';
  const [, m, d] = dateStr.split('-');
  return `${MONTHS[+m - 1]} ${+d}`;
}
