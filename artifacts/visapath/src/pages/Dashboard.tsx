import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  useGetDashboardSummary,
  useGetRecentActivity,
  useListApplications,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import StatusBadge from "@/components/StatusBadge";
import { formatDate, formatRelativeTime, formatCurrency } from "@/lib/utils";
import {
  FileText,
  Globe,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  Activity,
  TrendingUp,
  XCircle,
  Loader2,
} from "lucide-react";

const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
};
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() },
  });
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity({ limit: 8 });
  const { data: applicationsData } = useListApplications({ status: "all", limit: 5 });

  const recentApps = applicationsData?.applications ?? [];

  const stats = [
    {
      label: "Total Applications",
      value: summary?.totalApplications ?? 0,
      icon: FileText,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Pending Review",
      value: summary?.pending ?? 0,
      icon: Clock,
      color: "bg-amber-500/10 text-amber-300",
    },
    {
      label: "Approved",
      value: summary?.approved ?? 0,
      icon: CheckCircle2,
      color: "bg-emerald-500/10 text-emerald-300",
    },
    {
      label: "Success Rate",
      value: `${summary?.successRate ?? 0}%`,
      icon: TrendingUp,
      color: "bg-sky-500/10 text-sky-300",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-foreground">
          Good to see you, {user?.firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your visa applications and track their progress
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="bg-card border border-border rounded-xl p-5"
            >
              {summaryLoading ? (
                <div className="animate-pulse">
                  <div className="w-8 h-8 bg-muted rounded-lg mb-3" />
                  <div className="h-7 w-12 bg-muted rounded mb-1" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>
              ) : (
                <>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Recent Applications</h2>
              <Link href="/applications">
                <div className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer font-medium">
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            </div>

            {recentApps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">No applications yet</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Start your first visa application today
                </p>
                <Link href="/apply">
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium cursor-pointer">
                    <Plus className="w-4 h-4" />
                    Apply Now
                  </div>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentApps.map((app) => (
                  <Link key={app.id} href={`/applications/${app.id}`}>
                    <div className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors cursor-pointer">
                      <span className="text-3xl">{app.countryFlag}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">{app.countryName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {app.visaType.replace(/_/g, " ")} · {formatCurrency(app.fee)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={app.status} />
                        <span className="text-xs text-muted-foreground">{formatDate(app.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {recentApps.length > 0 && (
              <div className="px-5 py-4 border-t border-border">
                <Link href="/apply">
                  <div className="flex items-center gap-2 text-sm text-primary font-medium cursor-pointer hover:underline">
                    <Plus className="w-4 h-4" />
                    Start a new application
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Recent Activity</h2>
          </div>

          {activityLoading ? (
            <div className="p-5 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-2 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activity?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <p className="text-sm text-muted-foreground">No activity yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {activity?.map((item) => (
                <div key={item.id} className="flex gap-3 px-5 py-3.5">
                  <span className="text-lg flex-shrink-0">{item.countryFlag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-snug">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(item.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <motion.div
        className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {[
          {
            href: "/apply",
            icon: Globe,
            label: "New Application",
            desc: "Apply for an e-visa to a new destination",
            color: "bg-primary/10 text-primary",
          },
          {
            href: "/applications",
            icon: FileText,
            label: "My Applications",
            desc: "Track and manage all your applications",
            color: "bg-sky-500/10 text-sky-300",
          },
          {
            href: "/track",
            icon: CheckCircle2,
            label: "Track a Visa",
            desc: "Check status with a reference number",
            color: "bg-emerald-500/10 text-emerald-300",
          },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${action.color}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}
