export function toYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseYMD(value) {
  if (!value) return new Date();
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function startOfIsoWeek(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = start.getDay();
  start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day));
  return start;
}

function endOfIsoWeek(date) {
  const end = startOfIsoWeek(date);
  end.setDate(end.getDate() + 6);
  return end;
}

export function rangeForPeriod(type, anchor) {
  const date = anchor instanceof Date ? anchor : parseYMD(anchor);

  if (type === 'daily') {
    const day = toYMD(date);
    return { from: day, to: day };
  }

  if (type === 'weekly') {
    return { from: toYMD(startOfIsoWeek(date)), to: toYMD(endOfIsoWeek(date)) };
  }

  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { from: toYMD(start), to: toYMD(end) };
}

export function defaultAnchor(type) {
  const today = new Date();
  if (type === 'daily') {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return yesterday;
  }
  if (type === 'weekly') {
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    return lastWeek;
  }
  return today;
}

export function buildReportForm(type = 'monthly', anchor) {
  const range = rangeForPeriod(type, anchor || defaultAnchor(type));
  return {
    type,
    from: range.from,
    to: range.to,
    picker: type === 'monthly' ? range.from.slice(0, 7) : range.from,
  };
}
