export function pct(value) {
    return Math.round(value * 100);
  }

export function ratio(used, total) {
    if (!total) return 0;
    return Math.round((used / total) * 100);
  }