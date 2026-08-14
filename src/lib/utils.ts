export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN')
}

export function formatDate(date: string): string {
  return date
}
