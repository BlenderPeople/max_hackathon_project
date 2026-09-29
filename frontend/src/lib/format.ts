export function formatMoney(value: string | null) {
  if (value === null) return 'Цена уточняется';
  return `${Math.round(Number(value)).toLocaleString('ru-RU')} ₽`;
}

export function formatDate(value: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return 'Срок не указан';
  return new Intl.DateTimeFormat('ru-RU', options ?? { day: 'numeric', month: 'long' }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export function formatFileSize(bytes: number) {
  if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} КБ`;
  return `${(bytes / 1_000_000).toFixed(1).replace('.', ',')} МБ`;
}

export function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
