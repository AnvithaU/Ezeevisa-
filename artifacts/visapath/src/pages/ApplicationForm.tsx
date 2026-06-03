import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetApplication,
  useUpdateApplication,
  useSubmitApplication,
  useUploadDocument,
  useListApplicationDocuments,
  useDeleteDocument,
  getGetApplicationQueryKey,
  getListApplicationsQueryKey,
  getGetDashboardSummaryQueryKey,
  getListApplicationDocumentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Upload,
  X,
  FileText,
  AlertCircle,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { customFetch } from "@/lib/customFetch";

const STEPS = [
  { id: 1, label: "Travel Details" },
  { id: 2, label: "Personal Info" },
  { id: 3, label: "Accommodation" },
  { id: 4, label: "Documents" },
  { id: 5, label: "Review" },
];

export default function ApplicationForm() {
  const { id } = useParams<{ id: string }>();
  const appId = parseInt(id!, 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: app, isLoading } = useGetApplication(appId, {
    query: { enabled: !!appId, queryKey: getGetApplicationQueryKey(appId) },
  });
  const { data: documents } = useListApplicationDocuments(appId, {
    query: { enabled: !!appId, queryKey: getListApplicationDocumentsQueryKey(appId) },
  });

  const updateMutation = useUpdateApplication();
  const submitMutation = useSubmitApplication();
  const uploadMutation = useUploadDocument();
  const deleteDocMutation = useDeleteDocument();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const handleOcrScan = async (file: File) => {
    setOcrLoading(true);
    setOcrError(null);
    setOcrSuccess(false);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const extracted = await customFetch<{
          firstName: string;
          lastName: string;
          passportNumber: string;
          dateOfBirth: string;
          passportExpiry: string;
          gender: string;
        }>("/api/ocr/passport", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl }),
        });
        setFormData((prev) => ({
          ...prev,
          ...(extracted.firstName ? { firstName: extracted.firstName } : {}),
          ...(extracted.lastName ? { lastName: extracted.lastName } : {}),
          ...(extracted.passportNumber ? { passportNumber: extracted.passportNumber } : {}),
          ...(extracted.dateOfBirth ? { dateOfBirth: extracted.dateOfBirth } : {}),
          ...(extracted.passportExpiry ? { passportExpiry: extracted.passportExpiry } : {}),
          ...(extracted.gender ? { gender: extracted.gender } : {}),
        }));
        setOcrSuccess(true);
        setTimeout(() => setOcrSuccess(false), 4000);
      } catch {
        setOcrError("Could not read passport. Please fill in details manually.");
      } finally {
        setOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const [formData, setFormData] = useState({
    travelDate: app?.travelDate ?? "",
    returnDate: app?.returnDate ?? "",
    purpose: app?.purpose ?? "",
    passportNumber: app?.passportNumber ?? "",
    passportExpiry: app?.passportExpiry ?? "",
    firstName: app?.firstName ?? "",
    lastName: app?.lastName ?? "",
    dateOfBirth: app?.dateOfBirth ?? "",
    gender: app?.gender ?? "",
    occupation: app?.occupation ?? "",
    hotelName: app?.hotelName ?? "",
    hotelAddress: app?.hotelAddress ?? "",
  });

  const handleUpdate = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const saveStep = async () => {
    setSaving(true);
    setError(null);
    try {
      await new Promise<void>((resolve, reject) => {
        updateMutation.mutate(
          { id: appId, data: formData },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(appId) });
              resolve();
            },
            onError: (err: any) => reject(err),
          }
        );
      });
    } catch {
      setError("Failed to save. Please try again.");
      setSaving(false);
      return false;
    }
    setSaving(false);
    return true;
  };

  const handleNext = async () => {
    if (step < 4) {
      const ok = await saveStep();
      if (ok) setStep((s) => s + 1);
    } else if (step === 4) {
      setStep(5);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    submitMutation.mutate(
      { id: appId },
      {
        onSuccess: (updatedApp) => {
          queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          setLocation(`/applications/${appId}`);
        },
        onError: (err: any) => {
          setError(err?.data?.error || "Failed to submit application");
          setSaving(false);
        },
      }
    );
  };

  const handleFileUpload = async (docType: string, file: File) => {
    setUploadingType(docType);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      uploadMutation.mutate(
        {
          id: appId,
          data: {
            type: docType,
            filename: file.name,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            dataUrl,
          },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListApplicationDocumentsQueryKey(appId) });
            setUploadingType(null);
          },
          onError: () => setUploadingType(null),
        }
      );
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDoc = (docId: number) => {
    deleteDocMutation.mutate(
      { id: appId, docId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListApplicationDocumentsQueryKey(appId) });
        },
      }
    );
  };

  const docTypes = [
    { type: "passport_copy", label: "Passport Copy", required: true, desc: "Front page with photo" },
    { type: "photo", label: "Passport Photo", required: true, desc: "Recent passport-size photo" },
    { type: "bank_statement", label: "Bank Statement", required: false, desc: "Last 3 months" },
    { type: "hotel_booking", label: "Hotel Booking", required: false, desc: "Confirmed accommodation" },
    { type: "return_ticket", label: "Return Ticket", required: false, desc: "Confirmed flight booking" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!app) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link href="/applications">
        <div className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 cursor-pointer transition-colors">
          <ArrowLeft className="w-4 h-4" />
          My Applications
        </div>
      </Link>

      {/* App header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{app.countryFlag}</span>
        <div>
          <h1 className="text-xl font-bold text-foreground">{app.countryName} — e-Visa</h1>
          <p className="text-sm text-muted-foreground">{app.visaType.replace(/_/g, " ")}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                  step > s.id
                    ? "bg-primary border-primary text-primary-foreground"
                    : step === s.id
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground bg-background"
                )}
              >
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span
                className={cn(
                  "text-xs mt-1 hidden sm:block text-center",
                  step === s.id ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={cn(
                "h-0.5 flex-1 -mt-4 sm:-mt-5",
                step > s.id ? "bg-primary" : "bg-border"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive mb-4"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-semibold text-foreground text-lg">Travel Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Travel Date</label>
                  <input
                    type="date"
                    className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    value={formData.travelDate}
                    onChange={(e) => handleUpdate("travelDate", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Return Date</label>
                  <input
                    type="date"
                    className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    value={formData.returnDate}
                    onChange={(e) => handleUpdate("returnDate", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Purpose of Visit</label>
                <select
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  value={formData.purpose}
                  onChange={(e) => handleUpdate("purpose", e.target.value)}
                >
                  <option value="">Select purpose</option>
                  <option value="tourism">Tourism / Leisure</option>
                  <option value="business">Business</option>
                  <option value="medical">Medical</option>
                  <option value="transit">Transit</option>
                  <option value="family">Family Visit</option>
                  <option value="education">Education</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-semibold text-foreground text-lg">Personal Information</h2>
                <button
                  type="button"
                  disabled={ocrLoading}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*,.pdf";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleOcrScan(file);
                    };
                    input.click();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-60 flex-shrink-0"
                >
                  {ocrLoading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning...</>
                  ) : (
                    <><ScanLine className="w-3.5 h-3.5" /> Scan Passport</>
                  )}
                </button>
              </div>

              {ocrSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-400/30 rounded-lg text-sm text-emerald-300"
                >
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                  Passport scanned successfully! Please verify the details below.
                </motion.div>
              )}

              {ocrError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-400/30 rounded-lg text-sm text-amber-300"
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {ocrError}
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">First Name (as on passport)</label>
                  <input
                    className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="RAHUL"
                    value={formData.firstName}
                    onChange={(e) => handleUpdate("firstName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Last Name (as on passport)</label>
                  <input
                    className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="SHARMA"
                    value={formData.lastName}
                    onChange={(e) => handleUpdate("lastName", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Passport Number</label>
                  <input
                    className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all uppercase"
                    placeholder="A1234567"
                    value={formData.passportNumber}
                    onChange={(e) => handleUpdate("passportNumber", e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Passport Expiry</label>
                  <input
                    type="date"
                    className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    value={formData.passportExpiry}
                    onChange={(e) => handleUpdate("passportExpiry", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleUpdate("dateOfBirth", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Gender</label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    value={formData.gender}
                    onChange={(e) => handleUpdate("gender", e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Occupation</label>
                  <input
                    className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="Software Engineer"
                    value={formData.occupation}
                    onChange={(e) => handleUpdate("occupation", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-semibold text-foreground text-lg">Accommodation Details</h2>
              <p className="text-sm text-muted-foreground">Provide your confirmed accommodation details for the destination country.</p>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Hotel / Accommodation Name</label>
                <input
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="Grand Hotel Dubai"
                  value={formData.hotelName}
                  onChange={(e) => handleUpdate("hotelName", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Full Address</label>
                <textarea
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                  rows={3}
                  placeholder="Sheikh Zayed Road, Dubai, UAE"
                  value={formData.hotelAddress}
                  onChange={(e) => handleUpdate("hotelAddress", e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-semibold text-foreground text-lg">Upload Documents</h2>
              <p className="text-sm text-muted-foreground">
                Upload clear scans or photos. Accepted: PDF, JPG, PNG (max 10MB each).
              </p>
              <div className="space-y-3">
                {docTypes.map((docType) => {
                  const uploaded = documents?.find((d) => d.type === docType.type);
                  return (
                    <div
                      key={docType.type}
                      className="flex items-center gap-4 p-4 bg-muted/30 border border-border rounded-xl"
                    >
                      <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4.5 h-4.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{docType.label}</p>
                          {docType.required && (
                            <span className="text-xs text-destructive">Required</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{docType.desc}</p>
                        {uploaded && (
                          <p className="text-xs text-primary mt-1">{uploaded.originalName}</p>
                        )}
                      </div>
                      {uploaded ? (
                        <button
                          onClick={() => handleDeleteDoc(uploaded.id)}
                          className="flex items-center gap-1.5 text-xs text-destructive hover:underline"
                        >
                          <X className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      ) : (
                        <button
                          disabled={uploadingType === docType.type}
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = ".pdf,.jpg,.jpeg,.png";
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) handleFileUpload(docType.type, file);
                            };
                            input.click();
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-60"
                        >
                          {uploadingType === docType.type ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          Upload
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <h2 className="font-semibold text-foreground text-lg">Review & Submit</h2>
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Application Summary</p>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{app.countryFlag}</span>
                    <div>
                      <p className="font-semibold text-foreground">{app.countryName}</p>
                      <p className="text-sm text-muted-foreground">{app.visaType.replace(/_/g, " ")}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-lg font-bold text-primary">{formatCurrency(app.fee)}</p>
                      <p className="text-xs text-muted-foreground">Visa fee</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {[
                      ["Travel Date", app.travelDate || formData.travelDate || "—"],
                      ["Return Date", app.returnDate || formData.returnDate || "—"],
                      ["Purpose", app.purpose || formData.purpose || "—"],
                      ["Passport", app.passportNumber || formData.passportNumber || "—"],
                      ["Name", app.firstName ? `${app.firstName} ${app.lastName}` : formData.firstName ? `${formData.firstName} ${formData.lastName}` : "—"],
                      ["Documents", `${documents?.length ?? 0} uploaded`],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-foreground font-medium">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <p className="text-sm text-foreground font-medium mb-1">Before you submit</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Verify all details match your passport exactly</li>
                    <li>• Ensure all required documents are uploaded</li>
                    <li>• Travel dates must be within visa validity</li>
                    <li>• Your e-visa will be emailed once approved</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2.5 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {step < 5 ? (
          <button
            onClick={handleNext}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Submit Application
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
