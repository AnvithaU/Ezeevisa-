import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useListApplications, getListApplicationsQueryKey } from "@workspace/api-client-react";
import StatusBadge from "@/components/StatusBadge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { FileText, Plus, Clock, ArrowRight, Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "draft" | "submitted" | "under_review" | "approved" | "rejected";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function Applications() {
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("all");

  const { data, isLoading } = useListApplications(
    { status: activeStatus, limit: 50 },
    { query: { queryKey: getListApplicationsQueryKey({ status: activeStatus }) } }
  );

  const apps = data?.applications ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and manage all your visa applications
          </p>
        </div>
        <Link href="/apply">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all cursor-pointer">
            <Plus className="w-4 h-4" />
            New Application
          </div>
        </Link>
      </motion.div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveStatus(tab.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
              activeStatus === tab.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Application list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : apps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Globe className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">No applications found</p>
          <p className="text-sm text-muted-foreground mt-1 mb-6">
            {activeStatus === "all"
              ? "Start your first visa application"
              : `No ${activeStatus.replace("_", " ")} applications`}
          </p>
          <Link href="/apply">
            <div className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold cursor-pointer hover:bg-primary/90 transition-all">
              <Plus className="w-4 h-4" />
              Apply Now
            </div>
          </Link>
        </div>
      ) : (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {apps.map((app) => (
            <Link key={app.id} href={`/applications/${app.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 p-5 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group"
              >
                <span className="text-3xl flex-shrink-0">{app.countryFlag}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-semibold text-foreground">{app.countryName}</p>
                    <StatusBadge status={app.status} />
                    {app.referenceNumber && (
                      <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {app.referenceNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {app.visaType.replace(/_/g, " ")}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Created {formatDate(app.createdAt)}
                    </span>
                    {app.travelDate && (
                      <span>Travel: {formatDate(app.travelDate)}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <p className="font-bold text-primary">{formatCurrency(app.fee)}</p>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      )}
    </div>
  );
}
