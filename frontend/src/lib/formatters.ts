export function formatCompactNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  if (Math.abs(num) >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + 'B';
  }
  if (Math.abs(num) >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + 'M';
  }
  if (Math.abs(num) >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

export function formatIndianNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return num.toLocaleString('en-IN');
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
