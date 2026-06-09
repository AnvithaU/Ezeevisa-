import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
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
  const today = new Date().toISOString().split("T")[0];
  const parseLocalDate = (dateString: string) => {
    if (!dateString) return null;

    const [year, month, day] = dateString.split("-").map(Number);

    return new Date(year, month - 1, day);
  };

  const calculateAge = (dobString: string) => {
    const dob = parseLocalDate(dobString);

    if (!dob) return 0;

    const today = new Date();

    let age = today.getFullYear() - dob.getFullYear();

    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age;
  };

  const { data: app, isLoading } = useGetApplication(appId, {
    query: { enabled: !!appId, queryKey: getGetApplicationQueryKey(appId) },
  });
  const { data: documents } = useListApplicationDocuments(appId, {
    query: {
      enabled: !!appId,
      queryKey: getListApplicationDocumentsQueryKey(appId),
    },
  });

  const updateMutation = useUpdateApplication();
  const submitMutation = useSubmitApplication();
  const uploadMutation = useUploadDocument();
  const deleteDocMutation = useDeleteDocument();

  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleOcrScan = async (file: File) => {
    setOcrLoading(true);
    setOcrError(null);
    setOcrSuccess(false);
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const dataUrl = typeof reader.result === "string" ? reader.result : "";

        if (!dataUrl) throw new Error("File read failed");

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

        console.log("OCR extracted:", extracted);

        setFormData((prev) => ({
          ...prev,
          firstName:
            extracted?.firstName && extracted.firstName !== "UNKNOWN"
              ? extracted.firstName
              : prev.firstName,
          lastName:
            extracted?.lastName && extracted.lastName !== "UNKNOWN"
              ? extracted.lastName
              : prev.lastName,

          passportNumber: extracted?.passportNumber?.trim()
            ? extracted.passportNumber
            : prev.passportNumber,
          dateOfBirth: extracted?.dateOfBirth || prev.dateOfBirth,
          passportExpiry: extracted?.passportExpiry || prev.passportExpiry,
          gender: extracted?.gender || prev.gender,
        }));

        setOcrSuccess(true);
        setTimeout(() => setOcrSuccess(false), 4000);
      } catch (err) {
        console.error(err);
        setOcrError("Could not read passport. Please fill manually.");
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
    passportIssueDate: app?.passportIssueDate ?? "",

    firstName: app?.firstName ?? "",
    lastName: app?.lastName ?? "",
    nationality: app?.nationality ?? "",
    placeOfBirth: app?.placeOfBirth ?? "",
    dateOfBirth: app?.dateOfBirth ?? "",
    gender: app?.gender ?? "",
    occupation: app?.occupation ?? "",
    hotelName: app?.hotelName ?? "",
    hotelAddress: app?.hotelAddress ?? "",
    purposeOther: "",
  });
  useEffect(() => {
    if (!app) return;

    setFormData({
      travelDate: app.travelDate ?? "",
      returnDate: app.returnDate ?? "",
      purpose: app.purpose ?? "",
      passportNumber: app.passportNumber ?? "",
      passportExpiry: app.passportExpiry ?? "",
      passportIssueDate: app?.passportIssueDate ?? "",
      firstName: app.firstName ?? "",
      lastName: app.lastName ?? "",
      nationality: app?.nationality ?? "",
      placeOfBirth: app?.placeOfBirth ?? "",
      dateOfBirth: app.dateOfBirth ?? "",
      gender: app.gender ?? "",
      occupation: app.occupation ?? "",
      hotelName: app.hotelName ?? "",
      hotelAddress: app.hotelAddress ?? "",
      purposeOther: "",
    });
  }, [app]);

  const handleUpdate = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // clear error when user starts fixing field
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };
  const isStep1Valid = () => {
    if (!formData.travelDate || !formData.returnDate || !formData.purpose) {
      return false;
    }

    const travel = parseLocalDate(formData.travelDate);
    const returnDate = parseLocalDate(formData.returnDate);

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    if (!travel || !returnDate) return false;

    if (travel < todayDate) return false;

    if (returnDate <= travel) return false;

    if (formData.purpose === "other" && !formData.purposeOther.trim()) {
      return false;
    }

    return true;
  };
  const validateStep2 = () => {
    const errors: Record<string, string> = {};

    if (!formData.firstName) errors.firstName = "First name is required";
    if (!formData.lastName) errors.lastName = "Last name is required";
    if (!formData.nationality) errors.nationality = "Nationality is required";

    if (!formData.passportIssueDate)
      errors.passportIssueDate = "Passport issue date is required";

    if (!formData.placeOfBirth)
      errors.placeOfBirth = "Place of birth is required";
    if (!formData.passportNumber)
      errors.passportNumber = "Passport number is required";
    if (!formData.passportExpiry)
      errors.passportExpiry = "Passport expiry is required";
    if (!formData.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
    if (!formData.gender) errors.gender = "Please select gender";

    const todayDate = new Date(today);
    const dob = parseLocalDate(formData.dateOfBirth);
    const expiry = parseLocalDate(formData.passportExpiry);
    const issueDate = parseLocalDate(formData.passportIssueDate);
    if (issueDate) {
      if (issueDate > todayDate) {
        errors.passportIssueDate =
          "Passport issue date cannot be in the future";
      }

      if (expiry && issueDate >= expiry) {
        errors.passportIssueDate = "Issue date must be before expiry date";
      }
    }
    const travelDate = parseLocalDate(formData.travelDate);
    // DOB validation
    if (formData.dateOfBirth && dob) {
      const age = calculateAge(formData.dateOfBirth);

      if (dob > todayDate) {
        errors.dateOfBirth = "Date of birth cannot be in the future";
      } else if (age > 120) {
        errors.dateOfBirth = "Enter a valid date of birth";
      }
    }
    // Passport expiry validation

    if (formData.passportExpiry && expiry) {
      if (expiry <= todayDate) {
        errors.passportExpiry = "Passport is expired";
      }

      if (travelDate && expiry <= travelDate) {
        errors.passportExpiry = "Passport must remain valid after travel date";
      }

      if (travelDate) {
        const sixMonthsAfterTravel = new Date(travelDate);

        sixMonthsAfterTravel.setMonth(sixMonthsAfterTravel.getMonth() + 6);

        if (expiry < sixMonthsAfterTravel) {
          errors.passportExpiry =
            "Passport must be valid for at least 6 months after travel date";
        }
      }
    }
    // Passport number validation
    const passportRegex = /^[A-Z0-9]{6,15}$/;

    if (
      formData.passportNumber &&
      !passportRegex.test(formData.passportNumber)
    ) {
      errors.passportNumber = "Enter a valid passport number";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };
  const validateStep3 = () => {
    const errors: Record<string, string> = {};

    if (!formData.hotelName.trim()) {
      errors.hotelName = "Accommodation name is required";
    }

    if (!formData.hotelAddress.trim()) {
      errors.hotelAddress = "Accommodation address is required";
    }

    setFieldErrors((prev) => ({
      ...prev,
      ...errors,
    }));

    return Object.keys(errors).length === 0;
  };
  const saveStep = async () => {
    setSaving(true);
    setError(null);

    try {
      await updateMutation.mutateAsync({
        id: appId,
        data: formData,
      });

      await queryClient.invalidateQueries({
        queryKey: getGetApplicationQueryKey(appId),
      });

      return true;
    } catch {
      setError("Failed to save. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };
  const handleNext = async () => {
    setError(null);
    if (step === 1 && !isStep1Valid()) {
      setError("Please complete Travel Details correctly before continuing.");
      return;
    }

    if (step === 2 && !validateStep2()) {
      setError(
        "Please complete Personal Information correctly before continuing.",
      );
      return;
    }
    if (step === 3 && !validateStep3()) {
      setError("Please complete Accommodation Details before continuing.");
      return;
    }
    if (step === 4) {
      const requiredDocs = docTypes.map((d) => d.type);
      console.log("STEP 4 VALIDATION RUNNING");
      console.log(documents);

      const hasRequiredDocs = requiredDocs.every((type) =>
        documents?.some((d) => d.type === type),
      );

      if (!hasRequiredDocs) {
        setError("Please upload all required documents before continuing.");
        return;
      }
    }

    const ok = await saveStep();
    if (!ok) return;

    setStep((s) => (s < 5 ? s + 1 : 5));
  };

  const handleSubmit = async () => {
    if (!isStep1Valid() || !validateStep2() || !validateStep3()) {
      setError("Please complete all required fields before submitting.");
      return;
    }

    const requiredDocs = docTypes.map((d) => d.type);
    const hasRequiredDocs = requiredDocs.every((type) =>
      documents?.some((d) => d.type === type),
    );

    if (!hasRequiredDocs) {
      setError("Please upload Passport Copy and Passport Photo.");
      return;
    }

    setSaving(true);
    setError(null);

    submitMutation.mutate(
      { id: appId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListApplicationsQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetDashboardSummaryQueryKey(),
          });
          setLocation(`/applications/${appId}`);
        },
        onError: (err: any) => {
          setError(err?.data?.error || "Failed to submit application");
          setSaving(false);
        },
      },
    );
  };
  const handleFileUpload = async (docType: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError("File size cannot exceed 10MB");
      return;
    }
    setUploadingType(docType);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) throw new Error("Failed to read file");
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
            queryClient.invalidateQueries({
              queryKey: getListApplicationDocumentsQueryKey(appId),
            });
            setUploadingType(null);
          },
          onError: () => setUploadingType(null),
        },
      );
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDoc = (docId: number) => {
    deleteDocMutation.mutate(
      { id: appId, docId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListApplicationDocumentsQueryKey(appId),
          });
        },
      },
    );
  };

  const docTypes = [
    {
      type: "passport_copy",
      label: "Passport Copy",
      required: true,
      desc: "Front page with photo",
    },
    {
      type: "photo",
      label: "Passport Photo",
      required: true,
      desc: "Recent passport-size photo",
    },
    {
      type: "bank_statement",
      label: "Bank Statement",
      required: false,
      desc: "Last 3 months",
    },
    {
      type: "hotel_booking",
      label: "Hotel Booking",
      required: false,
      desc: "Confirmed accommodation",
    },
    {
      type: "return_ticket",
      label: "Return Ticket",
      required: false,
      desc: "Confirmed flight booking",
    },
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
          <h1 className="text-xl font-bold text-foreground">
            {app.countryName} — e-Visa
          </h1>
          <p className="text-sm text-muted-foreground">
            {(app.visaType ?? "").replace(/_/g, " ")}
          </p>
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
                      : "border-border text-muted-foreground bg-background",
                )}
              >
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span
                className={cn(
                  "text-xs mt-1 hidden sm:block text-center",
                  step === s.id
                    ? "text-primary font-medium"
                    : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 -mt-4 sm:-mt-5",
                  step > s.id ? "bg-primary" : "bg-border",
                )}
              />
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
              <h2 className="font-semibold text-foreground text-lg">
                Travel Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Travel Date
                  </label>
                  <input
                    type="date"
                    min={today}
                    className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground"
                    value={formData.travelDate}
                    onChange={(e) => {
                      const travelDate = e.target.value;

                      setFormData((prev) => ({
                        ...prev,
                        travelDate,
                        returnDate:
                          prev.returnDate && prev.returnDate <= travelDate
                            ? ""
                            : prev.returnDate,
                      }));
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Return Date
                  </label>
                  <input
                    type="date"
                    min={formData.travelDate || today}
                    className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    value={formData.returnDate}
                    onChange={(e) => handleUpdate("returnDate", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Purpose of Visit
                </label>
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
                  <option value="other">Other</option>
                </select>

                {formData.purpose === "other" && (
                  <input
                    className="w-full mt-2 px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm"
                    placeholder="Please specify purpose"
                    value={(formData as any).purposeOther || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        purposeOther: e.target.value,
                      }))
                    }
                  />
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-semibold text-foreground text-lg">
                  Personal Information
                </h2>
                <button
                  type="button"
                  disabled={ocrLoading}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];

                      if (file) handleOcrScan(file);
                    };
                    input.click();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-60 flex-shrink-0"
                >
                  {ocrLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                      Scanning...
                    </>
                  ) : (
                    <>
                      <ScanLine className="w-3.5 h-3.5" /> Scan Passport
                    </>
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
                  Passport scanned successfully! Please verify the details
                  below.
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
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    First Name (as on passport)
                  </label>

                  <input
                    className={cn(
                      "w-full px-3.5 py-2.5 bg-background border rounded-lg text-sm transition-all",
                      fieldErrors.firstName
                        ? "border-red-500 focus:ring-red-500"
                        : "border-input focus:ring-primary/30 focus:border-primary",
                    )}
                    placeholder="RAHUL"
                    value={formData.firstName}
                    onChange={(e) => handleUpdate("firstName", e.target.value)}
                  />

                  {fieldErrors.firstName && (
                    <p className="text-xs text-red-500 mt-1">
                      {fieldErrors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Last Name (as on passport)
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="SHARMA"
                    value={formData.lastName}
                    onChange={(e) => handleUpdate("lastName", e.target.value)}
                  />
                  {fieldErrors.lastName && (
                    <p className="text-xs text-red-500 mt-1">
                      {fieldErrors.lastName}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Passport Number
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all uppercase"
                    placeholder="A1234567"
                    value={formData.passportNumber}
                    onChange={(e) =>
                      handleUpdate(
                        "passportNumber",
                        e.target.value.toUpperCase(),
                      )
                    }
                  />
                  {fieldErrors.passportNumber && (
                    <p className="text-xs text-red-500 mt-1">
                      {fieldErrors.passportNumber}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Passport Expiry
                  </label>
                  <input
                    type="date"
                    min={today}
                    className={cn(
                      "w-full px-3.5 py-2.5 bg-background border rounded-lg text-sm text-foreground transition-all",
                      fieldErrors.passportExpiry
                        ? "border-red-500"
                        : "border-input",
                    )}
                    value={formData.passportExpiry}
                    onChange={(e) =>
                      handleUpdate("passportExpiry", e.target.value)
                    }
                  />

                  {fieldErrors.passportExpiry && (
                    <p className="text-xs text-red-500 mt-1">
                      {fieldErrors.passportExpiry}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label>Nationality</label>

                  <input
                    className={cn(
                      "w-full px-3.5 py-2.5 bg-background border rounded-lg text-sm text-foreground",
                      fieldErrors.nationality
                        ? "border-red-500"
                        : "border-input",
                    )}
                    value={formData.nationality}
                    onChange={(e) =>
                      handleUpdate("nationality", e.target.value)
                    }
                  />
                  {fieldErrors.nationality && (
                    <p className="text-xs text-red-500 mt-1">
                      {fieldErrors.nationality}
                    </p>
                  )}
                </div>

                <div>
                  <label>Passport Issue Date</label>

                  <input
                    type="date"
                    className={cn(
                      "w-full px-3.5 py-2.5 bg-background border rounded-lg text-sm text-foreground",
                      fieldErrors.passportIssueDate
                        ? "border-red-500"
                        : "border-input",
                    )}
                    value={formData.passportIssueDate}
                    onChange={(e) =>
                      handleUpdate("passportIssueDate", e.target.value)
                    }
                  />
                  {fieldErrors.passportIssueDate && (
                    <p className="text-xs text-red-500 mt-1">
                      {fieldErrors.passportIssueDate}
                    </p>
                  )}
                </div>

                <div>
                  <label>Place Of Birth</label>

                  <input
                    value={formData.placeOfBirth}
                    onChange={(e) =>
                      handleUpdate("placeOfBirth", e.target.value)
                    }
                    className={cn(
                      "w-full px-3.5 py-2.5 bg-background border rounded-lg text-sm text-foreground",
                      fieldErrors.placeOfBirth
                        ? "border-red-500"
                        : "border-input",
                    )}
                  />
                  {fieldErrors.placeOfBirth && (
                    <p className="text-xs text-red-500 mt-1">
                      {fieldErrors.placeOfBirth}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    max={today}
                    className="w-full px-3.5 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      handleUpdate("dateOfBirth", e.target.value)
                    }
                  />

                  {fieldErrors.dateOfBirth && (
                    <p className="text-xs text-red-500 mt-1">
                      {fieldErrors.dateOfBirth}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Gender
                  </label>
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
                  {fieldErrors.gender && (
                    <p className="text-xs text-red-500 mt-1">
                      {fieldErrors.gender}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Occupation
                  </label>
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
              <h2 className="font-semibold text-foreground text-lg">
                Accommodation Details
              </h2>
              <p className="text-sm text-muted-foreground">
                Provide your confirmed accommodation details for the destination
                country.
              </p>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Hotel / Accommodation Name
                </label>
                <input
                  className={cn(
                    "w-full px-3.5 py-2.5 bg-background border rounded-lg text-sm text-foreground",
                    fieldErrors.hotelName ? "border-red-500" : "border-input",
                  )}
                  placeholder="Grand Hotel Dubai"
                  value={formData.hotelName}
                  onChange={(e) => handleUpdate("hotelName", e.target.value)}
                />

                {fieldErrors.hotelName && (
                  <p className="text-xs text-red-500 mt-1">
                    {fieldErrors.hotelName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Full Address
                </label>
                <textarea
                  className={cn(
                    "w-full px-3.5 py-2.5 bg-background border rounded-lg text-sm text-foreground resize-none",
                    fieldErrors.hotelAddress
                      ? "border-red-500"
                      : "border-input",
                  )}
                  rows={3}
                  placeholder="Sheikh Zayed Road, Dubai, UAE"
                  value={formData.hotelAddress}
                  onChange={(e) => handleUpdate("hotelAddress", e.target.value)}
                />

                {fieldErrors.hotelAddress && (
                  <p className="text-xs text-red-500 mt-1">
                    {fieldErrors.hotelAddress}
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-semibold text-foreground text-lg">
                Upload Documents
              </h2>

              <p className="text-sm text-muted-foreground">
                Upload clear scans or photos. Accepted: PDF, JPG, PNG (max 10MB
                each).
              </p>
              <div className="space-y-3">
                {docTypes.map((docType) => {
                  const uploaded = documents?.find(
                    (d) => d.type === docType.type,
                  );
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
                          <p className="text-sm font-medium text-foreground">
                            {docType.label}
                          </p>
                          {docType.required && (
                            <span className="text-xs text-destructive">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {docType.desc}
                        </p>
                        {uploaded && (
                          <p className="text-xs text-primary mt-1">
                            {uploaded.originalName}
                          </p>
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
                              const file = (e.target as HTMLInputElement)
                                .files?.[0];
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
              <h2 className="font-semibold text-foreground text-lg">
                Review & Submit
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Application Summary
                  </p>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{app.countryFlag}</span>
                    <div>
                      <p className="font-semibold text-foreground">
                        {app.countryName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(app.visaType ?? "").replace(/_/g, " ")}
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(app.fee)}
                      </p>
                      <p className="text-xs text-muted-foreground">Visa fee</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {[
                      ["Travel Date", formData.travelDate || "—"],
                      ["Return Date", formData.returnDate || "—"],
                      [
                        "Purpose",
                        formData.purpose === "other"
                          ? formData.purposeOther
                          : formData.purpose || "—",
                      ],
                      ["Passport", formData.passportNumber || "—"],
                      [
                        "Name",
                        `${formData.firstName} ${formData.lastName}`.trim() ||
                          "—",
                      ],
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
                  <p className="text-sm text-foreground font-medium mb-1">
                    Before you submit
                  </p>
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
            disabled={saving || (step === 1 && !isStep1Valid())}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending || saving}
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
