import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { VISA_REQUIREMENTS } from "@/lib/visaRequirements";
import VisaPhotoStep from "@/components/VisaPhotoStep";
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
import { useQueryClient, useQuery } from "@tanstack/react-query";
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
type FormData = {
  travelDate: string;
  returnDate: string;
  purpose: string;
  passportNumber: string;
  passportExpiry: string;
  passportIssueDate: string;

  firstName: string;
  lastName: string;
  nationality: string;
  placeOfBirth: string;
  dateOfBirth: string;
  gender: string;
  occupation: string;
  hotelName: string;
  hotelAddress: string;

  purposeOther: string;
};
const STEPS = [
  { id: 1, label: "Travel Details" },
  { id: 2, label: "Personal Info" },
  { id: 3, label: "Visa Photo" },
  { id: 4, label: "Accommodation" },
  { id: 5, label: "Documents" },
  { id: 6, label: "Review" },
];

const GoldCheckbox = ({ label, checked, onChange, loading }: any) => (
  <label className="flex w-fit items-center gap-3 px-4 py-2 bg-gradient-to-r from-[#c9a84c]/10 to-[#8b6914]/5 border border-[#c9a84c]/30 rounded-xl cursor-pointer hover:border-[#c9a84c]/60 transition-all shadow-[0_0_15px_rgba(201,168,76,0.1)] group mb-4">
    <div
      className={cn(
        "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
        checked
          ? "bg-[#c9a84c] border-[#c9a84c]"
          : "bg-white border-[#c9a84c]/50 group-hover:border-[#c9a84c]",
      )}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
      ) : (
        checked && <Check className="w-3.5 h-3.5 text-white" />
      )}
    </div>
    <span className="text-[13px] font-bold bg-gradient-to-r from-[#c9a84c] to-[#8b6914] bg-clip-text text-transparent uppercase tracking-wider">
      {label}
    </span>
    <input
      type="checkbox"
      className="hidden"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
  </label>
);

export default function ApplicationForm() {
  const { id } = useParams<{ id: string }>();
  const appId = Number(id);

  if (!id || Number.isNaN(appId)) {
    return (
      <div className="p-4 text-red-500">
        Invalid application link. Please go back and try again.
      </div>
    );
  }
  const [, setLocation] = useLocation();
  const [showScanner, setShowScanner] = useState(false);
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [visaPhotoFile, setVisaPhotoFile] = useState<File | null>(null);
  const [linkedDocs, setLinkedDocs] = useState<string[]>([]);
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [showReviewScreen, setShowReviewScreen] = useState(false);
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
  // Fetch group data to figure out which traveler number this is!
  const { data: groupData } = useQuery({
    queryKey: ["group-applications", (app as any)?.groupId],
    queryFn: async () => {
      return await customFetch<{ applications: any[] }>(
        `/api/applications/group/${(app as any).groupId}`,
      );
    },
    enabled: !!(app as any)?.groupId,
  });

  const travelerIndex = groupData?.applications
    ? groupData.applications.findIndex((a: any) => a.id === appId) + 1
    : 0;

  const updateMutation = useUpdateApplication();
  const submitMutation = useSubmitApplication();
  const uploadMutation = useUploadDocument();
  const deleteDocMutation = useDeleteDocument();

  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [passportFrontFile, setPassportFrontFile] = useState<File | null>(null);
  const passportFrontUploaded = documents?.find(
    (d) => d.type === "passport_front",
  );

  const [ocrMeta, setOcrMeta] = useState({
    confidence: 0,
    mrzDetected: false,
  });
  const ocrTriggeredRef = useRef(false);

  const [passportBackFile, setPassportBackFile] = useState<File | null>(null);
  const passportBackUploaded = documents?.find(
    (d) => d.type === "passport_back",
  );
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (ocrLoading) return;

    if (passportFrontFile && passportBackFile && !ocrTriggeredRef.current) {
      ocrTriggeredRef.current = true;

      handleOcrScan([passportFrontFile, passportBackFile]);
    }
  }, [passportFrontFile, passportBackFile]);

  const handleOcrScan = async (files: File[]) => {
    setOcrLoading(true);
    setShowScanner(false);
    setOcrError(null);
    setOcrSuccess(false);

    try {
      const dataUrls = await Promise.all(
        files.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();

              reader.onload = () => resolve(reader.result as string);

              reader.onerror = reject;

              reader.readAsDataURL(file);
            }),
        ),
      );

      const extracted = await customFetch<{
        firstName: string;
        lastName: string;
        passportNumber: string;
        dateOfBirth: string;
        passportExpiry: string;
        gender: string;
        nationality: string;
        placeOfBirth: string;
        passportIssueDate: string;

        mrzDetected: boolean;
        confidence: number;

        documentQuality: "good" | "acceptable" | "poor";

        isExpired: boolean;
        isBlurry: boolean;
        isCutOff: boolean;
        hasGlare: boolean;

        validationMessage: string;
      }>("/api/ocr/passport", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: dataUrls,
        }),
      });
      // 1. Check for Expiration First
      if (extracted.isExpired) {
        setOcrSuccess(false);
        setOcrError("Passport is expired. Please upload a valid passport.");
        // Instantly turn the Passport Expiry input field red!
        setFieldErrors((prev) => ({
          ...prev,
          passportExpiry: "Passport is expired",
        }));
      }
      // 2. Then check for blur/glare
      else if (extracted.isBlurry || extracted.isCutOff || extracted.hasGlare) {
        setOcrSuccess(false);
        setOcrError(
          "Passport image quality is poor. Please verify all extracted information.",
        );
      }
      // 3. Only show success if it's a valid, unexpired, clear passport
      else {
        setOcrSuccess(true);
        setShowScanner(false);
        setTimeout(() => setOcrSuccess(false), 4000);
      }

      setOcrMeta({
        confidence: extracted.confidence,
        mrzDetected: extracted.mrzDetected,
      });

      setFormData((prev) => ({
        ...prev,
        firstName:
          extracted?.firstName && extracted.firstName !== "UNKNOWN"
            ? extracted.firstName.toUpperCase()
            : prev.firstName,
        lastName:
          extracted?.lastName && extracted.lastName !== "UNKNOWN"
            ? extracted.lastName.toUpperCase()
            : prev.lastName,
        passportNumber: extracted?.passportNumber?.trim()
          ? extracted.passportNumber.toUpperCase()
          : prev.passportNumber,
        // ... rest of the fields
        dateOfBirth: extracted?.dateOfBirth || prev.dateOfBirth,
        passportExpiry: extracted?.passportExpiry || prev.passportExpiry,
        gender: extracted?.gender || prev.gender,
        nationality: extracted?.nationality || prev.nationality,
        placeOfBirth: extracted?.placeOfBirth || prev.placeOfBirth,
        passportIssueDate:
          extracted?.passportIssueDate || prev.passportIssueDate,
      }));

      if (!extracted.isBlurry && !extracted.isCutOff && !extracted.hasGlare) {
        setOcrSuccess(true);
      }
      setTimeout(() => setOcrSuccess(false), 4000);
    } catch (err: any) {
      console.error("OCR FRONTEND ERROR:", err);

      setOcrError(
        err?.message || "Could not read passport. Please fill manually.",
      );
    } finally {
      setOcrLoading(false);
    }
  };

  const [formData, setFormData] = useState<FormData>({
    travelDate: "",
    returnDate: "",
    purpose: "",
    passportNumber: "",
    passportExpiry: "",
    passportIssueDate: "",

    firstName: "",
    lastName: "",
    nationality: "",
    placeOfBirth: "",
    dateOfBirth: "",
    gender: "",
    occupation: "",
    hotelName: "",
    hotelAddress: "",
    purposeOther: "",
  });
  const normalize = (app: any): FormData => ({
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
    purposeOther: app?.purposeOther ?? "",
  });
  const initializedRef = useRef(false);

  useEffect(() => {
    if (app && !initializedRef.current) {
      setFormData(normalize(app));
      initializedRef.current = true;
    }
  }, [app]);

  const handleUpdate = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
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
    if (!formData.occupation) {
      errors.occupation = "Occupation is required";
    }

    const todayDate = new Date(today);
    const dob = parseLocalDate(formData.dateOfBirth);
    const expiry = parseLocalDate(formData.passportExpiry);
    const issueDate = parseLocalDate(formData.passportIssueDate);
    if (issueDate) {
      if (issueDate > todayDate) {
        errors.passportIssueDate =
          "Passport issue date cannot be in the future";
      }
      if (dob && issueDate <= dob) {
        errors.passportIssueDate =
          "Passport issue date must be after date of birth";
      }

      if (expiry && issueDate >= expiry) {
        errors.passportIssueDate = "Issue date must be before expiry date";
      }

      if (expiry) {
        const validityYears =
          (expiry.getTime() - issueDate.getTime()) /
          (1000 * 60 * 60 * 24 * 365);

        if (validityYears < 1) {
          errors.passportExpiry = "Passport validity period appears invalid";
        }

        if (validityYears > 10.5) {
          errors.passportExpiry = "Passport validity period appears invalid";
        }
      }
    }
    const travelDate = parseLocalDate(formData.travelDate);
    // DOB validation

    const age = calculateAge(formData.dateOfBirth);

    if (dob) {
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
    }

    if (travelDate && expiry) {
      if (expiry <= travelDate) {
        errors.passportExpiry = "Passport must remain valid after travel date";
      }

      const sixMonthsAfterTravel = new Date(travelDate);
      sixMonthsAfterTravel.setMonth(sixMonthsAfterTravel.getMonth() + 6);

      if (expiry < sixMonthsAfterTravel) {
        errors.passportExpiry =
          "Passport must be valid for at least 6 months after travel date";
      }
    }
    if (travelDate && issueDate && travelDate < issueDate) {
      errors.travelDate = "Travel date cannot be before passport issue date";
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

    setFieldErrors(errors);

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
    // NEW STEP 3 VALIDATION
    if (step === 3 && !visaPhotoFile) {
      setError(
        "Please capture and validate your visa photo before continuing.",
      );
      return;
    }
    // PREVIOUS STEP 3 IS NOW STEP 4
    if (step === 4 && !validateStep3()) {
      setError("Please complete Accommodation Details before continuing.");
      return;
    }
    // PREVIOUS STEP 4 IS NOW STEP 5
    if (step === 5) {
      const requiredDocs = [
        "passport_front",
        "passport_back",
        ...docTypes
          .filter((d) => d.required && d.type !== "photo")
          .map((d) => d.type),
      ];

      console.log("STEP 4 VALIDATION RUNNING");
      console.log(documents);
      const hasRequiredDocs = requiredDocs.every(
        (type) =>
          documents?.some((d) => d.type === type) || linkedDocs.includes(type),
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

    const requiredDocs = [
      "passport_front",
      "passport_back",
      ...docTypes.filter((d) => d.required).map((d) => d.type),
    ];
    const hasRequiredDocs = requiredDocs.every(
      (type) =>
        documents?.some((d) => d.type === type) || linkedDocs.includes(type),
    );

    if (!hasRequiredDocs) {
      setError(
        "Please upload passport front page, passport back page and passport photo.",
      );
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
          setShowReviewScreen(true);
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
    const allowedTypes = ["image/jpeg", "image/png"];

    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type");
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

  const handleLinkPrimaryDocument = async (docType: string) => {
    try {
      if (!groupData?.applications?.[0]?.id) {
        setError("Could not find primary applicant.");
        return;
      }
      const primaryAppId = groupData.applications[0].id;

      setUploadingType(docType); // Show the loading spinner

      // 1. Fetch the primary applicant's document list
      const docsResponse = await customFetch<any[]>(
        `/api/applications/${primaryAppId}/documents`,
      );
      const primaryDoc = docsResponse.find((d) => d.type === docType);

      if (!primaryDoc) {
        setError(
          `The primary applicant has not uploaded a ${docType.replace(/_/g, " ")} yet!`,
        );
        setUploadingType(null);
        return;
      }

      // 2. Download the actual file from your server
      const fileResponse = await fetch(primaryDoc.url);
      const blob = await fileResponse.blob();

      // 3. Convert it and upload it to the current traveler!
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;

        uploadMutation.mutate(
          {
            id: appId,
            data: {
              type: docType,
              filename: primaryDoc.filename,
              originalName: primaryDoc.originalName,
              mimeType: primaryDoc.mimeType,
              size: primaryDoc.size,
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
            onError: () => {
              setError("Failed to copy document.");
              setUploadingType(null);
            },
          },
        );
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      setError("Failed to fetch primary document.");
      setUploadingType(null);
    }
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

  // DYNAMIC DOCUMENT TYPES BASED ON COUNTRY
  const countryConfig = app?.countryCode
    ? VISA_REQUIREMENTS[app.countryCode]
    : null;
  console.log("Country Code:", app?.countryCode);
  console.log("Country Config:", countryConfig);
  console.log("Photo Background:", countryConfig?.photoBackground);

  // If we don't have a specific config for this country yet, fallback to a default set
  const fallbackDocs = [
    {
      type: "photo",
      label: "Passport Photo",
      required: true,
      desc: "Recent passport-size photo",
    },
    {
      type: "return_ticket",
      label: "Return Ticket",
      required: true,
      desc: "Confirmed flight booking",
    },
  ];

  // Map the configuration to the format our UI and Validation expects!
  const docTypes = countryConfig
    ? countryConfig.documents.map((doc) => ({
        type: doc.id,
        label: doc.title,
        required: true,
        desc: doc.description,
      }))
    : fallbackDocs;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!app) return null;

  if (showReviewScreen) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-card border border-border shadow-xl rounded-2xl p-8 md:p-12 relative overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute inset-0 bg-primary/5 pointer-events-none" />

          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-500" />
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-3 font-serif">
            Application Submitted!
          </h2>
          <p className="text-muted-foreground mb-8">
            Your e-Visa application for {app.countryName} has been successfully
            submitted. We will process it shortly.
          </p>
          <div className="bg-muted/30 border border-border rounded-xl p-8 mb-4">
            <h3 className="text-lg font-bold text-foreground mb-2">
              Would you like to leave a review?
            </h3>
            <p className="text-sm text-muted-foreground mb-8">
              Share your seamless visa experience with thousands of other
              travelers.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setLocation("/write-review")}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md"
              >
                Yes, OK!
              </button>
              <button
                onClick={() =>
                  setLocation(
                    (app as any).groupId
                      ? `/apply/group/${(app as any).groupId}`
                      : "/applications",
                  )
                }
                className="px-8 py-3 bg-background border border-border text-foreground rounded-xl font-semibold hover:bg-muted transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link
        href={
          (app as any).groupId
            ? `/apply/group/${(app as any).groupId}`
            : "/applications"
        }
      >
        <div className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 cursor-pointer transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {(app as any).groupId ? "Back to Group Dashboard" : "My Applications"}
        </div>
      </Link>

      {/* App header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{app.countryFlag}</span>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-4">
            {app.countryName} — e-Visa
            {travelerIndex > 0 && (
              <div className="group relative flex items-center justify-center">
                {/* Glowing Aura Effect */}
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:bg-primary/40 transition-all duration-500"></div>

                {/* Sleek Glassmorphic Badge */}
                <span className="relative flex items-center gap-1.5 px-3 py-1 bg-background/80 border border-primary/30 text-primary rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-sm shadow-sm transition-all duration-300 group-hover:border-primary/60">
                  <Sparkles className="w-3.5 h-3.5" />
                  Traveler {travelerIndex}
                </span>
              </div>
            )}
          </h1>

          <p className="text-sm text-muted-foreground">
            {(app.visaType ?? "").replace(/_/g, " ")}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center flex-1">
            {/* Circle + Label */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300",
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
                  "hidden sm:block text-xs text-center mt-2 w-24",
                  step === s.id
                    ? "text-primary font-medium"
                    : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>

            {/* Connector */}
            {idx < STEPS.length - 1 && (
              <div className="flex-1 h-[2px] relative mb-5">
                {/* Base line */}
                <div className="absolute inset-0 bg-border rounded-full" />

                {/* Progress line */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-full transition-all duration-300",
                    step > s.id ? "bg-primary" : "bg-transparent",
                  )}
                />
              </div>
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
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground text-lg">
                  Travel Details
                </h2>

                {travelerIndex > 1 && (
                  <GoldCheckbox
                    label="Travel dates same as primary applicant"
                    checked={false} // We don't need to keep it checked, it's just a trigger button
                    onChange={async (checked: boolean) => {
                      if (checked && groupData?.applications?.[0]) {
                        const primaryApp = groupData.applications[0];
                        setFormData((prev) => ({
                          ...prev,
                          travelDate: primaryApp.travelDate || "",
                          returnDate: primaryApp.returnDate || "",
                          purpose: primaryApp.purpose || "",
                          purposeOther: primaryApp.purposeOther || "",
                        }));
                      }
                    }}
                  />
                )}
              </div>
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
                  {fieldErrors.travelDate && (
                    <p className="text-xs text-red-500 mt-1">
                      {fieldErrors.travelDate}
                    </p>
                  )}
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
              <div className="space-y-4">
                <h2 className="font-semibold text-foreground text-lg">
                  Personal Information
                </h2>

                {/* SINGLE GOLD "SCAN PASSPORT" BUTTON */}
                <button
                  type="button"
                  onClick={() => setShowScanner(!showScanner)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all shadow-sm border",
                    showScanner
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20",
                  )}
                >
                  {/* 1. Icon Logic (Spinner -> Check -> ScanLine) */}
                  {ocrLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (passportFrontFile || passportFrontUploaded) &&
                    (passportBackFile || passportBackUploaded) ? (
                    <Check className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <ScanLine className="w-5 h-5" />
                  )}

                  {/* 2. Text Logic */}
                  {ocrLoading
                    ? "Scanning Passport..."
                    : showScanner
                      ? "Close Scanner"
                      : (passportFrontFile || passportFrontUploaded) &&
                          (passportBackFile || passportBackUploaded)
                        ? "Passport Scanned"
                        : "Scan Passport"}
                </button>

                {/* EXPANDABLE UPLOAD AREA */}
                <AnimatePresence>
                  {showScanner && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 mt-2 bg-card border border-border shadow-sm rounded-xl space-y-4 relative">
                        {/* Subtle gold glow inside the box */}
                        <div className="absolute inset-0 bg-primary/5 rounded-xl pointer-events-none" />

                        <p className="text-sm font-medium text-foreground relative z-10">
                          Upload both the passport photo page (front) and the
                          address page (back) for automatic data extraction.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                          {/* Front Page Upload */}
                          <div>
                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Front Page (Photo) *
                            </label>
                            <button
                              type="button"
                              disabled={ocrLoading}
                              className="flex items-center gap-2 w-full px-4 py-2.5 bg-background border border-border text-foreground text-sm font-medium rounded-lg hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => {
                                const input = document.createElement("input");
                                input.type = "file";
                                input.accept = ".jpg,.jpeg,.png";
                                input.onchange = (e) => {
                                  const file = (e.target as HTMLInputElement)
                                    .files?.[0];
                                  if (file) {
                                    ocrTriggeredRef.current = false;
                                    setPassportFrontFile(file);
                                    handleFileUpload("passport_front", file);
                                  }
                                };
                                input.click();
                              }}
                            >
                              <Upload className="w-4 h-4 text-primary shrink-0" />
                              <span className="truncate">
                                {passportFrontFile?.name ||
                                  passportFrontUploaded?.originalName ||
                                  "Upload Front Page"}
                              </span>
                            </button>
                          </div>

                          {/* Back Page Upload */}
                          <div>
                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Back Page (Address) *
                            </label>
                            <button
                              type="button"
                              disabled={ocrLoading}
                              className="flex items-center gap-2 w-full px-4 py-2.5 bg-background border border-border text-foreground text-sm font-medium rounded-lg hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => {
                                const input = document.createElement("input");
                                input.type = "file";
                                input.accept = ".jpg,.jpeg,.png";
                                input.onchange = (e) => {
                                  const file = (e.target as HTMLInputElement)
                                    .files?.[0];
                                  if (file) {
                                    ocrTriggeredRef.current = false;
                                    setPassportBackFile(file);
                                    handleFileUpload("passport_back", file);
                                  }
                                };
                                input.click();
                              }}
                            >
                              <Upload className="w-4 h-4 text-primary shrink-0" />
                              <span className="truncate">
                                {passportBackFile?.name ||
                                  passportBackUploaded?.originalName ||
                                  "Upload Back Page"}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* {ocrLoading && ( ... keep everything below here identical! */}

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
              {ocrMeta.confidence > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    OCR Confidence: {(ocrMeta.confidence * 100).toFixed(0)}%
                  </p>

                  <p
                    className={cn(
                      "text-xs",
                      ocrMeta.mrzDetected ? "text-green-500" : "text-amber-500",
                    )}
                  >
                    {ocrMeta.mrzDetected
                      ? "MRZ detected successfully"
                      : "MRZ not detected"}
                  </p>
                </div>
              )}

              {ocrError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-400/30 rounded-lg text-sm text-amber-300"
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {ocrError}
                  {passportFrontFile && passportBackFile && (
                    <button
                      type="button"
                      onClick={() =>
                        handleOcrScan([passportFrontFile, passportBackFile])
                      }
                      className="ml-auto text-xs underline"
                    >
                      Retry Scan
                    </button>
                  )}
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
                        e.target.value.toUpperCase().replace(/\s/g, ""),
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
                    max={today}
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
                    max={today}
                    type="date"
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
                  <select
                    className={cn(
                      "w-full px-3.5 py-2.5 bg-background border rounded-lg text-sm transition-all",
                      fieldErrors.occupation
                        ? "border-red-500"
                        : "border-input",
                    )}
                    value={formData.occupation}
                    onChange={(e) => handleUpdate("occupation", e.target.value)}
                  >
                    <option value="">Select Occupation</option>
                    <option value="student">Student</option>
                    <option value="employed">Employed</option>
                    <option value="self_employed">Self Employed</option>
                    <option value="business_owner">Business Owner</option>
                    <option value="government_employee">
                      Government Employee
                    </option>
                    <option value="retired">Retired</option>
                    <option value="unemployed">Unemployed</option>
                  </select>
                  {fieldErrors.occupation && (
                    <p className="text-xs text-red-500 mt-1">
                      {fieldErrors.occupation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ----- NEW STEP 3: VISA PHOTO ----- */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-semibold text-foreground text-lg">
                Visa Photo Capture
              </h2>
              <VisaPhotoStep
                onComplete={(file) => {
                  setVisaPhotoFile(file);
                  handleFileUpload("photo", file);
                }}
                requiredBackground={countryConfig?.photoBackground ?? "white"}
              />

              {visaPhotoFile && (
                <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center gap-2 font-bold mt-4 border border-emerald-500/20">
                  <Check className="w-5 h-5" />
                  Photo successfully captured and validated!
                </div>
              )}
            </div>
          )}

          {/* ----- NEW STEP 4: ACCOMMODATION ----- */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground text-lg">
                  Accommodation Details
                </h2>
                {travelerIndex > 1 && (
                  <GoldCheckbox
                    label="Staying at same hotel as primary applicant"
                    checked={false}
                    onChange={async (checked: boolean) => {
                      if (checked && groupData?.applications?.[0]) {
                        const primaryApp = groupData.applications[0];
                        setFormData((prev) => ({
                          ...prev,
                          hotelName: primaryApp.hotelName || "",
                          hotelAddress: primaryApp.hotelAddress || "",
                        }));
                        // Clear errors if they auto-fill correctly
                        setFieldErrors((prev) => ({
                          ...prev,
                          hotelName: "",
                          hotelAddress: "",
                        }));
                      }
                    }}
                  />
                )}
              </div>

              {/* 🌟 FAMILY INHERITANCE: AUTOFILL BUTTON 🌟 */}
              {travelerIndex > 1 && groupData?.applications?.[0] && (
                <motion.button
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  type="button"
                  onClick={() => {
                    const primary = groupData.applications[0];
                    handleUpdate("hotelName", primary.hotelName || "");
                    handleUpdate("hotelAddress", primary.hotelAddress || "");
                  }}
                  className="mb-2 w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 border border-primary/20 text-primary font-bold rounded-xl hover:bg-primary/20 transition-all shadow-sm"
                >
                  <Sparkles className="w-5 h-5" />
                  Autofill Accommodation from Primary Applicant
                </motion.button>
              )}

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

          {/* ----- NEW STEP 5: DOCUMENTS ----- */}
          {step === 5 && (
            <div className="space-y-5">
              <h2 className="font-semibold text-foreground text-lg">
                Upload Documents
              </h2>

              <p className="text-sm text-muted-foreground">
                Upload clear scans or photos. Accepted: JPG, PNG (max 10MB
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
                      className="flex items-center gap-4 p-4 bg-muted/30 border border-border rounded-xl flex-wrap sm:flex-nowrap"
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
                        <p className="text-xs text-muted-foreground mb-1">
                          {docType.desc}
                        </p>
                        {uploaded && (
                          <p className="text-xs text-primary mt-1 font-medium">
                            ✓ {uploaded.originalName}
                          </p>
                        )}

                        {/* 🌟 NEW: FAMILY INHERITANCE BUTTON FOR DOCUMENTS 🌟 */}
                        {travelerIndex > 1 &&
                          docType.type !== "photo" &&
                          !uploaded && (
                            <div className="mt-3">
                              <GoldCheckbox
                                label="Copy from Primary Applicant"
                                checked={linkedDocs.includes(docType.type)}
                                loading={uploadingType === docType.type}
                                onChange={async (checked: boolean) => {
                                  if (
                                    checked &&
                                    !linkedDocs.includes(docType.type)
                                  ) {
                                    await handleLinkPrimaryDocument(
                                      docType.type,
                                    );
                                    setLinkedDocs((prev) => [
                                      ...prev,
                                      docType.type,
                                    ]);
                                  }
                                }}
                              />
                            </div>
                          )}
                      </div>

                      {/* UPLOAD / REMOVE BUTTONS */}
                      <div className="flex-shrink-0 ml-auto">
                        {uploaded ? (
                          <button
                            onClick={() => handleDeleteDoc(uploaded.id)}
                            className="flex items-center gap-1.5 text-xs text-destructive hover:underline"
                          >
                            <X className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        ) : linkedDocs.includes(docType.type) ? (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <Check className="w-4 h-4" /> Done
                          </span>
                        ) : (
                          <button
                            disabled={uploadingType === docType.type}
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = ".jpg,.jpeg,.png";
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
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ----- NEW STEP 6: REVIEW ----- */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Review & Submit
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Please ensure all details are exactly as they appear on your
                  passport.
                </p>
              </div>

              {/* Top Summary Banner with Flag & Fee */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
                <span className="text-4xl drop-shadow-sm">
                  {app.countryFlag}
                </span>
                <div>
                  <p className="font-bold text-foreground text-lg">
                    {app.countryName}
                  </p>
                  <p className="text-sm text-muted-foreground font-medium capitalize">
                    {(app.visaType ?? "").replace(/_/g, " ")}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(app.fee)}
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Visa Fee
                  </p>
                </div>
              </div>

              {/* Travel Details Card */}
              <div className="bg-muted/30 border border-border rounded-xl p-5 relative group transition-all hover:border-primary/30 shadow-sm">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="absolute top-4 right-4 text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Edit</span> ✏️
                </button>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                  ✈️ Travel Details
                </h3>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-[11px] uppercase mb-0.5">
                      Destination
                    </span>
                    <span className="font-semibold text-foreground">
                      {app.countryName}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px] uppercase mb-0.5">
                      Purpose
                    </span>
                    <span className="font-semibold text-foreground capitalize">
                      {formData.purpose === "other"
                        ? formData.purposeOther
                        : formData.purpose}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px] uppercase mb-0.5">
                      Travel Date
                    </span>
                    <span className="font-semibold text-foreground">
                      {formData.travelDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px] uppercase mb-0.5">
                      Return Date
                    </span>
                    <span className="font-semibold text-foreground">
                      {formData.returnDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Info Card */}
              <div className="bg-muted/30 border border-border rounded-xl p-5 relative group transition-all hover:border-primary/30 shadow-sm">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="absolute top-4 right-4 text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Edit</span> ✏️
                </button>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                  👤 Personal Info
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-[11px] uppercase mb-0.5">
                      First Name
                    </span>
                    <span className="font-semibold text-foreground">
                      {formData.firstName}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px] uppercase mb-0.5">
                      Last Name
                    </span>
                    <span className="font-semibold text-foreground">
                      {formData.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px] uppercase mb-0.5">
                      Date of Birth
                    </span>
                    <span className="font-semibold text-foreground">
                      {formData.dateOfBirth}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px] uppercase mb-0.5">
                      Gender
                    </span>
                    <span className="font-semibold text-foreground capitalize">
                      {formData.gender}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px] uppercase mb-0.5">
                      Nationality
                    </span>
                    <span className="font-semibold text-foreground">
                      {formData.nationality}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground block text-[11px] uppercase mb-0.5">
                      Place of Birth
                    </span>
                    <span className="font-semibold text-foreground">
                      {formData.placeOfBirth}
                    </span>
                  </div>
                </div>
              </div>

              {/* Passport Details Card */}
              <div className="bg-muted/30 border border-border rounded-xl p-5 relative group transition-all hover:border-primary/30 shadow-sm">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="absolute top-4 right-4 text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Edit</span> ✏️
                </button>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                  🛂 Passport Details
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-[11px] uppercase mb-0.5">
                      Passport Number
                    </span>
                    <span className="font-semibold text-foreground uppercase">
                      {formData.passportNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px] uppercase mb-0.5">
                      Issue Date
                    </span>
                    <span className="font-semibold text-foreground">
                      {formData.passportIssueDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px] uppercase mb-0.5">
                      Expiry Date
                    </span>
                    <span className="font-semibold text-foreground">
                      {formData.passportExpiry}
                    </span>
                  </div>
                </div>
              </div>

              {/* Accommodation Card */}
              <div className="bg-muted/30 border border-border rounded-xl p-5 relative group transition-all hover:border-primary/30 shadow-sm">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="absolute top-4 right-4 text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Edit</span> ✏️
                </button>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                  🏨 Accommodation
                </h3>
                <div className="text-sm">
                  <div className="font-semibold text-foreground mb-1">
                    {formData.hotelName}
                  </div>
                  <div className="text-muted-foreground text-xs leading-relaxed max-w-md">
                    {formData.hotelAddress}
                  </div>
                </div>
              </div>

              {/* Documents Card */}
              <div className="bg-muted/30 border border-border rounded-xl p-5 relative group transition-all hover:border-primary/30 shadow-sm">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="absolute top-4 right-4 text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Edit</span> ✏️
                </button>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                  📎 Documents
                </h3>
                <div className="flex flex-col gap-2.5">
                  {documents && documents.length > 0 ? (
                    documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-2.5 text-sm"
                      >
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-emerald-500" />
                        </div>
                        <span className="capitalize text-muted-foreground font-medium w-32">
                          {doc.type.replace(/_/g, " ")}:
                        </span>
                        <span className="font-semibold text-foreground truncate">
                          {doc.originalName}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-destructive font-medium">
                      ⚠️ No documents uploaded!
                    </span>
                  )}
                </div>
              </div>

              {/* Declaration Checkbox */}
              <div
                className="mt-8 p-5 bg-primary/5 border border-primary/20 rounded-xl flex gap-3.5 items-start cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => setDeclarationChecked(!declarationChecked)}
              >
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-primary text-primary focus:ring-primary cursor-pointer"
                  checked={declarationChecked}
                  onChange={(e) => setDeclarationChecked(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                />
                <label className="text-sm text-foreground leading-relaxed cursor-pointer font-medium">
                  I declare that all the information provided above is true and
                  accurate to the best of my knowledge. I understand that
                  submitting false or misleading information may result in the
                  immediate rejection of my e-Visa application.
                </label>
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

        {step < 6 ? (
          <button
            onClick={handleNext}
            disabled={Boolean(
              saving ||
                (step === 1 && !isStep1Valid()) ||
                (step === 2 &&
                  formData.passportExpiry &&
                  new Date(formData.passportExpiry) <= new Date()),
            )}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending || saving || !declarationChecked}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
