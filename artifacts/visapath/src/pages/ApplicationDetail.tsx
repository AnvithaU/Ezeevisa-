import { useParams, useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import {
  useGetApplication,
  useListApplicationDocuments,
  getGetApplicationQueryKey,
  getListApplicationDocumentsQueryKey,
} from "@workspace/api-client-react";
import StatusBadge from "@/components/StatusBadge";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Edit,
  Loader2,
  Download,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_TIMELINE = [
  { status: "draft", label: "Draft Created", icon: FileText },
  { status: "submitted", label: "Application Submitted", icon: Send },
  { status: "under_review", label: "Under Review", icon: Clock },
  { status: "approved", label: "Visa Approved", icon: CheckCircle2 },
];

const STATUS_ORDER = ["draft", "submitted", "under_review", "approved"];

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const appId = parseInt(id!, 10);

  const { data: app, isLoading } = useGetApplication(appId, {
    query: { enabled: !!appId, queryKey: getGetApplicationQueryKey(appId) },
  });

  const { data: documents } = useListApplicationDocuments(appId, {
    query: { enabled: !!appId, queryKey: getListApplicationDocumentsQueryKey(appId) },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Application not found</p>
        <Link href="/applications">
          <div className="mt-4 inline-flex items-center gap-2 text-primary text-sm cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back to applications
          </div>
        </Link>
      </div>
    );
  }

  const currentStatusIdx = app.status === "rejected"
    ? STATUS_ORDER.indexOf("under_review")
    : STATUS_ORDER.indexOf(app.status);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link href="/applications">
        <div className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 cursor-pointer transition-colors">
          <ArrowLeft className="w-4 h-4" />
          My Applications
        </div>
      </Link>

      {/* Header */}
      <motion.div
        className="flex items-center gap-4 mb-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-5xl">{app.countryFlag}</span>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{app.countryName}</h1>
            <StatusBadge status={app.status} />
          </div>
          <p className="text-muted-foreground mt-1">{app.visaType.replace(/_/g, " ")}</p>
          {app.referenceNumber && (
            <p className="text-sm font-mono text-primary mt-1">
              Ref: {app.referenceNumber}
            </p>
          )}
        </div>
        {app.status === "draft" && (
          <Link href={`/apply/${app.countryCode}/${app.visaType}/form/${app.id}`}>
            <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors cursor-pointer">
              <Edit className="w-4 h-4" />
              Continue Editing
            </div>
          </Link>
        )}
      </motion.div>

      {/* Status Timeline */}
      {app.status !== "rejected" && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-foreground mb-5">Application Progress</h2>
          <div className="flex items-start gap-0">
            {STATUS_TIMELINE.map((s, idx) => {
              const Icon = s.icon;
              const isDone = STATUS_ORDER.indexOf(s.status) <= currentStatusIdx;
              const isCurrent = STATUS_ORDER.indexOf(s.status) === currentStatusIdx;
              return (
                <div key={s.status} className="flex flex-col items-center flex-1">
                  <div className="relative flex items-center w-full">
                    {idx > 0 && (
                      <div className={cn(
                        "flex-1 h-0.5 -ml-0 mt-0",
                        isDone ? "bg-primary" : "bg-border"
                      )} />
                    )}
                    <div className={cn(
                      "w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10",
                      isDone
                        ? "bg-primary border-primary text-primary-foreground"
                        : isCurrent
                        ? "border-primary text-primary bg-background"
                        : "border-border text-muted-foreground bg-background"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {idx < STATUS_TIMELINE.length - 1 && (
                      <div className={cn(
                        "flex-1 h-0.5",
                        STATUS_ORDER.indexOf(s.status) < currentStatusIdx ? "bg-primary" : "bg-border"
                      )} />
                    )}
                  </div>
                  <p className={cn(
                    "text-xs mt-2 text-center max-w-16",
                    isCurrent ? "text-primary font-medium" : isDone ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {s.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rejected notice */}
      {app.status === "rejected" && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-destructive">Application Rejected</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your application has been rejected. Please review the requirements and re-apply.
            </p>
          </div>
        </div>
      )}

      {/* Approved — download */}
      {app.status === "approved" && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-800">Visa Approved</p>
              <p className="text-sm text-emerald-700">Your e-visa is ready. Download and carry it when you travel.</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Application Details */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Application Details</h2>
          <div className="space-y-3">
            {[
              { label: "Status", value: <StatusBadge status={app.status} /> },
              { label: "Visa Fee", value: formatCurrency(app.fee) },
              { label: "Created", value: formatDate(app.createdAt) },
              { label: "Travel Date", value: formatDate(app.travelDate) },
              { label: "Return Date", value: formatDate(app.returnDate) },
              { label: "Purpose", value: app.purpose ?? "—" },
              { label: "Submitted", value: formatDate(app.submittedAt) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground font-medium text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Applicant Details</h2>
          <div className="space-y-3">
            {[
              { label: "Full Name", value: app.firstName ? `${app.firstName} ${app.lastName}` : "—" },
              { label: "Passport No.", value: app.passportNumber ?? "—" },
              { label: "Passport Expiry", value: formatDate(app.passportExpiry) },
              { label: "Date of Birth", value: formatDate(app.dateOfBirth) },
              { label: "Gender", value: app.gender ?? "—" },
              { label: "Occupation", value: app.occupation ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground font-medium capitalize">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Documents */}
      {documents && documents.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mt-6">
          <h2 className="font-semibold text-foreground mb-4">Uploaded Documents</h2>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
              >
                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.originalName}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {doc.type.replace(/_/g, " ")} · {(doc.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hotel info */}
      {app.hotelName && (
        <div className="bg-card border border-border rounded-xl p-5 mt-6">
          <h2 className="font-semibold text-foreground mb-3">Accommodation</h2>
          <p className="font-medium text-foreground">{app.hotelName}</p>
          {app.hotelAddress && (
            <p className="text-sm text-muted-foreground mt-1">{app.hotelAddress}</p>
          )}
        </div>
      )}
    </div>
  );
}
