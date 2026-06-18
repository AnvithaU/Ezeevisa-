import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetVisaCountry,
  getListApplicationsQueryKey,
  getGetVisaCountryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Clock,
  Shield,
  FileCheck,
  Check,
  Loader2,
  Globe,
  Users,
  Minus,
  Plus as PlusIcon,
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { customFetch } from "@/lib/customFetch";

export default function ApplyVisaType() {
  const { countryCode } = useParams<{ countryCode: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: country, isLoading } = useGetVisaCountry(countryCode!, {
    query: {
      enabled: !!countryCode,
      queryKey: getGetVisaCountryQueryKey(countryCode!),
    },
  });

  const [selectedVisa, setSelectedVisa] = useState<string | null>(null);
  const [applicantCount, setApplicantCount] = useState(1);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const handleStartGroup = async (visaType: string) => {
    setIsCreatingGroup(true);
    try {
      const res = await customFetch<{ groupId: string; applications: any[] }>(
        "/api/applications/group",
        {
          method: "POST",
          body: JSON.stringify({
            countryCode: countryCode!,
            visaType,
            count: applicantCount,
          }),
        },
      );

      queryClient.invalidateQueries({
        queryKey: getListApplicationsQueryKey(),
      });

      // Navigate straight to Traveler 1's scanner!
      if (res.applications && res.applications.length > 0) {
        setLocation(
          `/apply/${countryCode}/${visaType}/form/${res.applications[0].id}`,
        );
      } else {
        setLocation(`/apply/group/${res.groupId}`);
      }
    } catch (err) {
      alert("Failed to start group application");
      setIsCreatingGroup(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!country) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Country not found</p>
        <Link href="/apply">
          <div className="mt-4 inline-flex items-center gap-2 text-primary text-sm cursor-pointer hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to countries
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link href="/apply">
        <div className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 cursor-pointer transition-colors">
          <ArrowLeft className="w-4 h-4" />
          All destinations
        </div>
      </Link>

      {/* Country header */}
      <motion.div
        className="flex items-center gap-4 mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-6xl">{country.flag}</span>
        <div>
          <p className="text-sm text-muted-foreground">{country.continent}</p>
          <h1 className="text-3xl font-bold text-foreground">{country.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {country.processingDays} day
              {country.processingDays !== 1 ? "s" : ""} processing
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              Up to {country.maxStay}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Requirements */}
      <motion.div
        className="bg-accent/40 border border-accent rounded-xl p-5 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <FileCheck className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">
            Required documents
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {country.requiredDocuments.map((doc) => (
            <div
              key={doc}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="capitalize">{doc.replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Visa types */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="font-semibold text-foreground mb-4">Select visa type</h2>
        <div className="space-y-4">
          {country.visaTypes.map((vt) => (
            <div
              key={vt.type}
              className={`w-full text-left bg-card border rounded-2xl p-6 transition-all duration-300 group ${
                selectedVisa === vt.type
                  ? "border-primary shadow-md"
                  : "border-border hover:border-primary/40 hover:shadow-lg"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <p className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">
                    {vt.label}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5 bg-accent/50 px-2.5 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5" />
                      Stay: {vt.duration}
                    </span>
                    <span className="flex items-center gap-1.5 bg-accent/50 px-2.5 py-1 rounded-md">
                      <Shield className="w-3.5 h-3.5" />
                      e-Visa
                    </span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(vt.fee)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    per applicant
                  </p>
                </div>
              </div>

              {/* Bottom Divider & Gold Button */}
              <div className="mt-5 pt-5 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 h-[44px]">
                {/* Expandable Applicant Counter */}
                <AnimatePresence mode="wait">
                  {selectedVisa === vt.type ? (
                    <motion.div
                      key="counter"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-3 bg-accent/30 p-1.5 rounded-lg border border-accent"
                    >
                      <Users className="w-4 h-4 text-primary ml-2" />
                      <span className="text-sm font-medium text-foreground mr-2">
                        Applicants:
                      </span>

                      <button
                        onClick={() =>
                          setApplicantCount(Math.max(1, applicantCount - 1))
                        }
                        className="w-7 h-7 flex items-center justify-center bg-background rounded-md border border-border hover:border-primary transition-colors disabled:opacity-50"
                        disabled={applicantCount <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <span className="text-sm font-bold w-4 text-center">
                        {applicantCount}
                      </span>

                      <button
                        onClick={() =>
                          setApplicantCount(Math.min(10, applicantCount + 1))
                        }
                        className="w-7 h-7 flex items-center justify-center bg-background rounded-md border border-border hover:border-primary transition-colors disabled:opacity-50"
                        disabled={applicantCount >= 10}
                      >
                        <PlusIcon className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.p
                      key="text"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs font-medium text-emerald-500/80 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Instant processing available
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  onClick={() =>
                    selectedVisa === vt.type
                      ? handleStartGroup(vt.type)
                      : setSelectedVisa(vt.type)
                  }
                  disabled={isCreatingGroup}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gold-gradient text-[hsl(217_60%_10%)] font-bold text-sm rounded-xl hover:brightness-110 hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isCreatingGroup && selectedVisa === vt.type ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : selectedVisa === vt.type ? (
                    <>
                      Confirm {applicantCount} Traveler
                      {applicantCount > 1 ? "s" : ""} →
                    </>
                  ) : (
                    <>Start Application →</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
