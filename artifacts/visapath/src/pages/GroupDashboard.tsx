import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@/lib/customFetch";
import {
  Loader2,
  Check,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";
import { getListApplicationsQueryKey } from "@workspace/api-client-react";

export default function GroupDashboard() {
  const [match, params] = useRoute("/apply/group/:groupId");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const groupId = params?.groupId;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch applications for this group
  const { data, isLoading } = useQuery({
    queryKey: ["group-applications", groupId],
    queryFn: async () => {
      return await customFetch<{ applications: any[] }>(
        `/api/applications/group/${groupId}`,
      );
    },
    enabled: !!groupId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.applications || data.applications.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Group not found.
      </div>
    );
  }

  const apps = data.applications;
  const isAllComplete = apps.every((app) => app.firstName && app.lastName);
  const totalFee = apps.reduce((sum, app) => sum + Number(app.fee), 0);

  const handleReviewAndPay = async () => {
    // 💡 LATER: This is exactly where you will open the Razorpay Modal!
    // For now, we will simulate a successful payment and submit to the backend:
    setIsSubmitting(true);
    try {
      await customFetch(`/api/applications/group/${groupId}/submit`, {
        method: "POST",
      });
      // Tell React Query to refresh the global list
      queryClient.invalidateQueries({
        queryKey: getListApplicationsQueryKey({ status: "all" }),
      });
      setShowSuccess(true);
    } catch (err) {
      alert("Failed to process payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-card border border-border shadow-xl rounded-2xl p-8 md:p-12 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-primary/5 pointer-events-none" />

          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-500" />
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-3 font-serif">
            Trip Successfully Booked!
          </h2>
          <p className="text-muted-foreground mb-8">
            Your e-Visa applications for all {apps.length} travelers to{" "}
            {apps[0].countryName} have been paid for and submitted.
          </p>

          <button
            onClick={() => setLocation("/applications")}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md w-full sm:w-auto"
          >
            Go to My Applications
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back Button */}
      <Link href="/applications">
        <div className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 cursor-pointer transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to all applications
        </div>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2 text-foreground">
          Group Application
        </h1>
        <p className="text-muted-foreground mb-8">
          Complete the details for all {apps.length} travelers below. You can
          scan their passports one by one!
        </p>
      </motion.div>

      <div className="space-y-4 mb-10">
        {apps.map((app, index) => {
          const isComplete = !!(app.firstName && app.lastName);

          return (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              key={app.id}
              className={`border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                isComplete
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-card border-border hover:border-primary/40"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    isComplete
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    {isComplete
                      ? `${app.firstName} ${app.lastName}`
                      : `Traveler ${index + 1}`}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {app.countryName} • {app.visaType.replace(/_/g, " ")}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-border/50">
                {isComplete ? (
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" /> Ready to submit
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-amber-500">
                    <AlertCircle className="w-4 h-4" /> Needs Passport
                  </span>
                )}

                <Link
                  href={`/apply/${app.countryCode}/${app.visaType}/form/${app.id}`}
                >
                  <button
                    className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${
                      isComplete
                        ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    }`}
                  >
                    {isComplete ? "Edit Details" : "Scan Passport →"}
                  </button>
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Review & Submit Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: apps.length * 0.1 }}
        className="bg-accent/40 border border-accent rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
      >
        <div>
          <h3 className="text-sm text-muted-foreground mb-1">
            Total Group Cost
          </h3>
          <p className="text-3xl font-bold text-foreground">
            {formatCurrency(totalFee)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            For all {apps.length} applicants
          </p>
        </div>

        <button
          disabled={!isAllComplete || isSubmitting}
          onClick={handleReviewAndPay}
          className="w-full sm:w-auto px-8 py-4 bg-gold-gradient text-[hsl(217_60%_10%)] font-bold text-lg rounded-xl shadow-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" /> Processing...
            </>
          ) : isAllComplete ? (
            <>
              Review & Pay <ArrowRight className="w-6 h-6" />
            </>
          ) : (
            <>Complete All Travelers First</>
          )}
        </button>
      </motion.div>
    </div>
  );
}
