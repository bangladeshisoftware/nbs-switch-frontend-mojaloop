/**************************************************************************
 * Copyright © 2026 Bangladeshi Software Ltd. All rights reserved.
 * Distributed under the license terms specified in this repository.
 *
 * ORIGINAL AUTHOR: Muhammad Nasim (Developer)
 **************************************************************************/

export const fmt = {
  date: (d) =>
    d
      ? new Date(d).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        })
      : '—',
  datetime: (d) =>
    d
      ? new Date(d).toLocaleString('en-US', {
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      : '—',
  amount: (a, c) =>
    a
      ? `${parseFloat(a).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c || ''}`
      : '—',
  truncate: (s, n = 20) =>
    s ? (s.length > n ? s.slice(0, n) + '...' : s) : '—',
  number: (n) => (n ? parseInt(n).toLocaleString() : '0'),
  percent: (n) => (n ? `${parseFloat(n).toFixed(1)}%` : '0%'),
};
