import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import { useGetVisaCountry, useCreateApplication, getListApplicationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Clock, Shield, FileCheck, Check, Loader2, Globe } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function ApplyVisaType() {
  const { countryCode } = useParams<{ countryCode: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: country, isLoading } = useGetVisaCountry(countryCode!, {
    query: { enabled: !!countryCode },
  });

  const createMutation = useCreateApplication();
  const [creating, setCreating] = useState<string | null>(null);

  const handleSelectType = (visaType: string) => {
    setCreating(visaType);
    createMutation.mutate(
      { data: { countryCode: countryCode!, visaType } },
      {
        onSuccess: (app) => {
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
          setLocation(`/apply/${countryCode}/${visaType}/form/${app.id}`);
        },
        onError: () => setCreating(null),
      }
    );
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
              {country.processingDays} day{country.processingDays !== 1 ? "s" : ""} processing
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
          <p className="text-sm font-semibold text-foreground">Required documents</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {country.requiredDocuments.map((doc) => (
            <div key={doc} className="flex items-center gap-2 text-sm text-muted-foreground">
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
        <div className="space-y-3">
          {country.visaTypes.map((vt) => (
            <button
              key={vt.type}
              onClick={() => handleSelectType(vt.type)}
              disabled={creating !== null}
              className="w-full text-left bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-sm transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {vt.label}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Stay: {vt.duration}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      e-Visa
                    </span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-xl font-bold text-primary">{formatCurrency(vt.fee)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">per applicant</p>
                  {creating === vt.type ? (
                    <div className="mt-2 flex items-center justify-end gap-1.5 text-xs text-primary">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating...
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Select →
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
