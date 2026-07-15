import type { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { tagChipClass } from './tagPalette'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-md border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  const styles = {
    primary: 'bg-titan-500 text-white hover:bg-titan-600',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }
  return (
    <button
      className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-titan-500 focus:outline-none focus:ring-1 focus:ring-titan-500"
      {...props}
    />
  )
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-titan-500 focus:outline-none focus:ring-1 focus:ring-titan-500"
      {...props}
    />
  )
}

export function Label({ children, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500" {...props}>
      {children}
    </label>
  )
}

const badgeColors: Record<string, string> = {
  UNSCHEDULED: 'bg-slate-100 text-slate-700',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  DISPATCHED: 'bg-blue-100 text-blue-700',
  EN_ROUTE: 'bg-amber-100 text-amber-800',
  ON_SITE: 'bg-amber-100 text-amber-800',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  CANCELED: 'bg-red-100 text-red-700',
  ON_HOLD: 'bg-slate-100 text-slate-700',
  DRAFT: 'bg-slate-100 text-slate-700',
  PRESENTED: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  DECLINED: 'bg-red-100 text-red-700',
  SENT: 'bg-blue-100 text-blue-700',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-800',
  PAID: 'bg-emerald-100 text-emerald-800',
  VOID: 'bg-red-100 text-red-700',
  LOW: 'bg-slate-100 text-slate-700',
  NORMAL: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-amber-100 text-amber-800',
  URGENT: 'bg-red-100 text-red-700',
}

export function Badge({ value }: { value: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${badgeColors[value] ?? 'bg-slate-100 text-slate-700'}`}
    >
      {value.replace('_', ' ')}
    </span>
  )
}

const priorityAccent: Record<string, string> = {
  LOW: 'border-l-slate-300',
  NORMAL: 'border-l-blue-400',
  HIGH: 'border-l-amber-500',
  URGENT: 'border-l-red-500',
}

export function priorityAccentClass(priority: string) {
  return priorityAccent[priority] ?? 'border-l-slate-300'
}

export function TagChip({ name, color }: { name: string; color: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${tagChipClass(color)}`}>
      {name}
    </span>
  )
}

export function formatCents(cents: number) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
