import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "approved": return "text-emerald-300 bg-emerald-500/10 border-emerald-400/30";
    case "rejected": return "text-red-300 bg-red-500/10 border-red-400/30";
    case "under_review": return "text-amber-300 bg-amber-500/10 border-amber-400/30";
    case "submitted": return "text-sky-300 bg-sky-500/10 border-sky-400/30";
    case "draft": return "text-slate-300 bg-slate-400/10 border-slate-400/25";
    default: return "text-slate-300 bg-slate-400/10 border-slate-400/25";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "approved": return "Approved";
    case "rejected": return "Rejected";
    case "under_review": return "Under Review";
    case "submitted": return "Submitted";
    case "draft": return "Draft";
    default: return status;
  }
}
