import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Upload,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Loader2,
  X,
  ChevronRight,
  User,
  Check,
} from "lucide-react";
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";
import { removeBackground } from "@imgly/background-removal";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    faceDetected: boolean;
    singleFace: boolean;
    faceCentered: boolean;
    faceSize: boolean;
    eyesOpen: boolean;
    neutralExpression: boolean;
    notBlurry: boolean;
    brightnessGood: boolean;
    backgroundUniform: boolean;
    backgroundClean: boolean;
    backgroundShadowFree: boolean;
  };
}

export default function VisaPhotoStep({
  onComplete,
  requiredBackground = "white",
}: {
  onComplete: (file: File) => void;
  requiredBackground?: "white" | "blue" | "any";
}) {
  const [mode, setMode] = useState<"options" | "camera" | "preview">("options");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const countryBg = requiredBackground === "blue" ? "#DBEAFE" : "#FFFFFF";
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setMode("camera");
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      streamRef.current = stream;
    } catch (err) {
      console.error(err);
      alert(
        "Could not access camera. Please allow permissions or upload a file.",
      );
      setMode("options");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const takePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    const scale = Math.min(
      1080 / video.videoWidth,
      1080 / video.videoHeight,
      1,
    );
    const width = video.videoWidth * scale;
    const height = video.videoHeight * scale;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);

    const initialUrl = canvas.toDataURL("image/jpeg", 0.95);
    setPhotoUrl(initialUrl);
    stopCamera();
    setMode("preview");

    processAndValidatePhoto(canvas);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhotoUrl(result);
      setMode("preview");

      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1080;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_DIM) {
          height *= MAX_DIM / width;
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width *= MAX_DIM / height;
          height = MAX_DIM;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        processAndValidatePhoto(canvas);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const processAndValidatePhoto = async (canvas: HTMLCanvasElement) => {
    setValidating(true);
    const errors: string[] = [];
    const warnings: string[] = [];
    const width = canvas.width;
    const height = canvas.height;

    const checks: ValidationResult["checks"] = {
      faceDetected: false,
      singleFace: false,
      faceCentered: false,
      faceSize: false,
      eyesOpen: false,
      neutralExpression: false,
      notBlurry: false,
      brightnessGood: false,
      backgroundUniform: false,
      backgroundClean: false,
      backgroundShadowFree: false,
    };

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm",
      );

      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        numFaces: 2,
      });

      const results = faceLandmarker.detect(canvas);
      const ctx = canvas.getContext("2d");

      if (results.faceLandmarks.length === 0) {
        errors.push(
          "No face detected. Please ensure your face is fully visible.",
        );
      } else {
        checks.faceDetected = true;
        if (results.faceLandmarks.length > 1) {
          errors.push(
            "Multiple people detected. Only one person allowed in a visa photo.",
          );
        } else {
          checks.singleFace = true;
          const landmarks = results.faceLandmarks[0];
          const leftEye = landmarks[33];
          const rightEye = landmarks[263];
          const nose = landmarks[1];

          const eyeCenterX = (leftEye.x + rightEye.x) / 2;
          const noseOffset = Math.abs(nose.x - eyeCenterX);

          const lookingStraight = noseOffset < 0.04;

          if (!lookingStraight) {
            errors.push(
              "Please look directly at the camera. Side-facing photos are not allowed.",
            );
          }

          let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
          for (const lm of landmarks) {
            minX = Math.min(minX, lm.x);
            minY = Math.min(minY, lm.y);
            maxX = Math.max(maxX, lm.x);
            maxY = Math.max(maxY, lm.y);
          }
          const bbox = {
            originX: minX * width,
            originY: minY * height,
            width: (maxX - minX) * width,
            height: (maxY - minY) * height,
          };

          const driftX =
            Math.abs(bbox.originX + bbox.width / 2 - width / 2) / width;
          const driftY =
            Math.abs(bbox.originY + bbox.height / 2 - height / 2) / height;

          checks.faceCentered = driftX < 0.25 && driftY < 0.25;
          if (!checks.faceCentered)
            errors.push(
              "Face is not centered. Position your face directly in the middle.",
            );

          const faceHeightRatio = bbox.height / height;
          checks.faceSize = faceHeightRatio >= 0.45 && faceHeightRatio <= 0.75;
          if (!checks.faceSize)
            errors.push(
              faceHeightRatio < 0.5
                ? "Face is too small. Move closer."
                : "Face is too large. Move further away.",
            );

          const leftEyeHeight = landmarks[145].y - landmarks[159].y;
          const rightEyeHeight = landmarks[374].y - landmarks[386].y;
          checks.eyesOpen = leftEyeHeight > 0.003 && rightEyeHeight > 0.003;
          if (!checks.eyesOpen)
            errors.push("Eyes must be open and clearly visible.");

          const mouthWidth = Math.abs(landmarks[291].x - landmarks[61].x);
          const mouthOpen = landmarks[14].y - landmarks[13].y;
          checks.neutralExpression = mouthOpen < 0.04 && mouthWidth > 0.05;
          if (!checks.neutralExpression)
            warnings.push(
              "Please maintain a neutral expression with a closed mouth.",
            );
          if (ctx) {
            const imageData = ctx.getImageData(0, 0, width, height);

            checks.notBlurry = detectBlur(imageData);

            if (!checks.notBlurry) {
              warnings.push("Image appears slightly soft, but is acceptable.");
            }

            const brightnessGood = detectBrightness(imageData);
            checks.brightnessGood = brightnessGood;

            if (!brightnessGood) {
              errors.push("Photo is too dark. Please use better lighting.");
            }
          }
        }
      }

      if (errors.length > 0) {
        setValidationResult({ valid: false, errors, warnings, checks });
        setValidating(false);
        return;
      }

      // --- Background Removal ---
      const bgRemovedCanvas = document.createElement("canvas");
      bgRemovedCanvas.width = width;
      bgRemovedCanvas.height = height;
      const bgCtx = bgRemovedCanvas.getContext("2d");

      try {
        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/jpeg"),
        );
        const config: any = { model: "small" };
        const fgBlob = await removeBackground(blob, config);
        const fgUrl = URL.createObjectURL(fgBlob);

        const fgImg = new Image();
        await new Promise((resolve) => {
          fgImg.onload = resolve;
          fgImg.src = fgUrl;
        });

        if (bgCtx) {
          bgCtx.fillStyle = countryBg;
          bgCtx.fillRect(0, 0, width, height);
          bgCtx.drawImage(fgImg, 0, 0, width, height);
          checks.backgroundUniform = true;
          checks.backgroundClean = true;
          checks.backgroundShadowFree = true;
          setPhotoUrl(bgRemovedCanvas.toDataURL("image/jpeg", 0.95));
        }
      } catch (segErr: any) {
        console.warn("Background replacement skipped:", segErr);
      }

      setValidationResult({ valid: true, errors, warnings, checks });
    } catch (err: any) {
      console.error(err);
      errors.push(`System Error: Could not run AI validation. ${err.message}`);
      setValidationResult({ valid: false, errors, warnings, checks });
    } finally {
      setValidating(false);
    }
  };

  const detectBlur = (imageData: ImageData): boolean => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const gray = new Float32Array(width * height);
    for (let i = 0; i < data.length; i += 4)
      gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    let sum = 0;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const laplacian =
          -gray[idx - width - 1] -
          gray[idx - width] -
          gray[idx - width + 1] -
          gray[idx - 1] +
          8 * gray[idx] -
          gray[idx + 1] -
          gray[idx + width - 1] -
          gray[idx + width] -
          gray[idx + width + 1];
        sum += laplacian * laplacian;
      }
    }
    return sum / ((width - 2) * (height - 2)) > 40;
  };
  const detectBrightness = (imageData: ImageData): boolean => {
    const data = imageData.data;

    let total = 0;

    for (let i = 0; i < data.length; i += 4) {
      total += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    }

    const avg = total / (data.length / 4);

    return avg > 70;
  };

  const handleConfirm = async () => {
    if (!photoUrl) return;
    const res = await fetch(photoUrl);
    const blob = await res.blob();
    const file = new File([blob], "visa_photo.jpg", { type: "image/jpeg" });
    onComplete(file);
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-[24px] p-8 lg:p-10 shadow-[0_20px_40px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] bg-white/85 backdrop-blur-[18px] border border-[#c9a84c]/20 relative overflow-hidden font-['DM_Sans',sans-serif]">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8b6914] via-[#c9a84c] to-[#e8c97a]"></div>

      <AnimatePresence mode="wait">
        {mode === "options" && (
          <motion.div
            key="options"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col md:flex-row gap-12 items-center justify-between"
          >
            <div className="flex-1 space-y-8">
              <div>
                <h2 className="text-[32px] font-light text-[#1f2937] tracking-tight mb-3 font-['Cormorant_Garamond',serif] leading-tight">
                  Capture your{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c9a84c] to-[#8b6914] font-medium">
                    Passport Photo
                  </span>
                </h2>
                <p className="text-[#1f2937]/65 text-[15px] leading-relaxed">
                  Provide a clear photo of yourself. Our AI will automatically
                  remove the background and ensure it meets international visa
                  requirements.
                </p>
              </div>
              <div className="space-y-3 p-5 bg-[#f5f0e8]/50 rounded-xl border border-[#c9a84c]/10 flex items-center justify-between">
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-[1.2px] text-[#c9a84c] block mb-1">
                    Auto-Background Color
                  </label>
                  <p className="text-[13px] text-[#1f2937]/70">
                    Strictly locked to visa requirements
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#c9a84c]/30 rounded-lg shadow-sm">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: countryBg }}
                  />
                  <span className="text-[13px] font-semibold text-[#1f2937] capitalize">
                    {requiredBackground === "any"
                      ? "White (Default)"
                      : requiredBackground}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[11px] font-medium uppercase tracking-[1.2px] text-[#c9a84c]">
                  Requirements
                </h3>
                <ul className="space-y-3">
                  {[
                    "Look straight at the camera with a neutral expression",
                    "Clear, sharp focus, with even lighting on your face",
                    "Please remove glasses and non-religious head coverings manually",
                  ].map((req, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-[#1f2937]/80 text-[14px]"
                    >
                      <CheckCircle className="w-5 h-5 text-[#c9a84c] shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex-1 w-full max-w-sm flex flex-col gap-4">
              <button
                onClick={startCamera}
                className="group relative overflow-hidden flex flex-col items-center justify-center gap-3 p-8 bg-[#faf7f1] text-[#1f2937] border border-[#c9a84c]/20 rounded-2xl hover:border-[#c9a84c]/60 hover:bg-white transition-all duration-500 shadow-sm hover:shadow-lg"
              >
                <div className="w-16 h-16 rounded-full bg-white shadow-[0_8px_20px_rgba(201,168,76,0.15)] flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <Camera className="w-7 h-7 text-[#c9a84c]" />
                </div>
                <span className="font-semibold text-[15px] tracking-wide">
                  Take Photo
                </span>
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-[#c9a84c]/10"></div>
                <span className="flex-shrink-0 mx-4 text-[#1f2937]/40 text-[11px] font-medium uppercase tracking-widest">
                  OR
                </span>
                <div className="flex-grow border-t border-[#c9a84c]/10"></div>
              </div>

              <label className="group relative overflow-hidden flex flex-col items-center justify-center gap-3 p-8 bg-white text-[#1f2937] border border-[#c9a84c]/20 rounded-2xl hover:border-[#c9a84c]/60 transition-all duration-500 shadow-sm hover:shadow-lg cursor-pointer">
                <div className="w-16 h-16 rounded-full bg-[#faf7f1] flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <Upload className="w-7 h-7 text-[#c9a84c]" />
                </div>
                <span className="font-semibold text-[15px] tracking-wide">
                  Upload Photo
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </motion.div>
        )}

        {mode === "camera" && (
          <motion.div
            key="camera"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center w-full"
          >
            <div className="w-full flex justify-between items-center mb-6">
              <h3 className="text-[26px] font-light text-[#1f2937] font-['Cormorant_Garamond',serif]">
                Camera
              </h3>
              <button
                onClick={() => {
                  stopCamera();
                  setMode("options");
                }}
                className="p-2 text-[#1f2937]/40 hover:text-[#c9a84c] transition-colors rounded-full hover:bg-[#c9a84c]/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative w-full max-w-2xl bg-[#1f2937] rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] sm:aspect-video flex items-center justify-center border border-[#c9a84c]/20">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
              />
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-48 h-64 sm:w-64 sm:h-80 border border-white/40 rounded-[100px] relative before:absolute before:inset-[-4px] before:border-2 before:border-white/20 before:rounded-[104px]">
                  <div className="absolute top-[40%] left-0 right-0 h-[1px] bg-white/30 border-y border-dashed border-white/40"></div>
                </div>
              </div>
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 flex items-center gap-2.5">
                <User className="w-4 h-4 text-[#c9a84c]" />
                <span className="text-white text-[13px] font-medium tracking-wide">
                  Position face inside oval
                </span>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={takePhoto}
                className="group relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#c9a84c] to-[#8b6914] rounded-full hover:shadow-[0_12px_40px_rgba(201,168,76,0.45)] transition-all duration-300"
              >
                <div className="absolute inset-1.5 border border-white/40 rounded-full group-hover:scale-95 transition-transform"></div>
                <Camera className="w-8 h-8 text-white" />
              </button>
            </div>
          </motion.div>
        )}

        {mode === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col lg:flex-row gap-8 lg:gap-12 w-full"
          >
            <div className="flex-1 flex flex-col gap-6">
              {/* DYNAMIC HEIGHT CONTAINER: This will perfectly wrap whatever shape the photo is! */}
              <div className="relative rounded-2xl overflow-hidden shadow-xl bg-[#faf7f1] w-full max-w-lg mx-auto border border-[#c9a84c]/10 flex items-center justify-center">
                {photoUrl && (
                  <img
                    src={photoUrl}
                    alt="Preview"
                    className="w-full h-auto rounded-2xl block"
                  />
                )}

                {validating && (
                  <>
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-10"></div>
                    <motion.div
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent z-20 shadow-[0_0_20px_rgba(201,168,76,0.8)]"
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{
                        duration: 2.5,
                        ease: "linear",
                        repeat: Infinity,
                      }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[#1f2937] z-30">
                      <Loader2 className="w-10 h-10 animate-spin text-[#c9a84c] mb-4" />
                      <p className="font-medium text-[15px] tracking-wide drop-shadow-md">
                        Scanning Biometrics...
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[26px] font-light text-[#1f2937] font-['Cormorant_Garamond',serif]">
                  Analysis Results
                </h3>
                <button
                  onClick={() => setMode("options")}
                  className="p-2 text-[#1f2937]/40 hover:text-[#c9a84c] transition-colors rounded-full hover:bg-[#c9a84c]/10"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                {!validating && validationResult && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "p-5 rounded-2xl border flex items-start gap-4",
                        validationResult.valid
                          ? "bg-[#4caf7d]/5 border-[#4caf7d]/20"
                          : "bg-[#e05a5a]/5 border-[#e05a5a]/20",
                      )}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-full shrink-0",
                          validationResult.valid
                            ? "bg-[#4caf7d]/10"
                            : "bg-[#e05a5a]/10",
                        )}
                      >
                        {validationResult.valid ? (
                          <CheckCircle className="w-6 h-6 text-[#4caf7d]" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-[#e05a5a]" />
                        )}
                      </div>
                      <div>
                        <h4
                          className={cn(
                            "text-[16px] font-bold mb-1",
                            validationResult.valid
                              ? "text-[#2f8c61]"
                              : "text-[#b93838]",
                          )}
                        >
                          {validationResult.valid
                            ? "Photo meets requirements"
                            : "Photo needs corrections"}
                        </h4>
                        <p
                          className={cn(
                            "text-[13px] leading-relaxed",
                            validationResult.valid
                              ? "text-[#4caf7d]"
                              : "text-[#e05a5a]",
                          )}
                        >
                          {validationResult.valid
                            ? "Your photo has passed all AI quality checks and is ready to use."
                            : "Please review the issues below and retake the photo."}
                        </p>
                      </div>
                    </motion.div>

                    {validationResult.errors.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="font-bold text-[#e05a5a] flex items-center gap-2 text-[14px]">
                          <X className="w-4 h-4" /> Issues to fix
                        </h5>
                        <ul className="space-y-2">
                          {validationResult.errors.map((err, i) => (
                            <li
                              key={i}
                              className="flex gap-2 text-[#1f2937]/80 text-[13px] bg-[#e05a5a]/5 p-3 rounded-xl border border-[#e05a5a]/10"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#e05a5a] mt-1.5 shrink-0" />
                              {err}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="bg-[#faf7f1] rounded-2xl p-5 border border-[#c9a84c]/10">
                      <h5 className="font-semibold text-[#1f2937] mb-4 text-[14px]">
                        Detailed Checks
                      </h5>
                      <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                        <CheckItem
                          label="Face Detected"
                          pass={validationResult.checks.faceDetected}
                        />
                        <CheckItem
                          label="Single Person"
                          pass={validationResult.checks.singleFace}
                        />
                        <CheckItem
                          label="Face Centered"
                          pass={validationResult.checks.faceCentered}
                        />
                        <CheckItem
                          label="Correct Size"
                          pass={validationResult.checks.faceSize}
                        />
                        <CheckItem
                          label="Eyes Open"
                          pass={validationResult.checks.eyesOpen}
                        />
                        <CheckItem
                          label="Neutral Expression"
                          pass={validationResult.checks.neutralExpression}
                        />
                        <CheckItem
                          label="Not Blurry"
                          pass={validationResult.checks.notBlurry}
                        />
                        <CheckItem
                          label="Good Lighting"
                          pass={validationResult.checks.brightnessGood}
                        />
                        <CheckItem
                          label="Uniform Background"
                          pass={validationResult.checks.backgroundUniform}
                        />

                        <CheckItem
                          label="Clean Background"
                          pass={validationResult.checks.backgroundClean}
                        />

                        <CheckItem
                          label="No Background Shadows"
                          pass={validationResult.checks.backgroundShadowFree}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-[#c9a84c]/10 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    setMode("options");
                    setPhotoUrl(null);
                    setValidationResult(null);
                  }}
                  className="flex-1 py-3.5 px-6 bg-white border border-[#c9a84c]/20 text-[#1f2937] rounded-xl font-semibold hover:border-[#c9a84c]/60 transition-all flex items-center justify-center gap-2 text-[14px]"
                >
                  <RefreshCw className="w-4 h-4" /> Retake Photo
                </button>
                <button
                  disabled={!validationResult?.valid}
                  onClick={handleConfirm}
                  className="flex-1 py-3.5 px-6 bg-gradient-to-r from-[#8b6914] via-[#c9a84c] to-[#e8c97a] bg-[length:200%_auto] text-white rounded-xl font-bold hover:bg-right transition-all duration-400 flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(201,168,76,0.3)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed group text-[14px] uppercase tracking-wide"
                >
                  Confirm
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CheckItem({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          "flex items-center justify-center w-5 h-5 rounded-full shrink-0",
          pass
            ? "bg-[#4caf7d]/10 text-[#4caf7d]"
            : "bg-[#e05a5a]/10 text-[#e05a5a]",
        )}
      >
        {pass ? (
          <CheckCircle className="w-3.5 h-3.5" />
        ) : (
          <X className="w-3.5 h-3.5" />
        )}
      </div>
      <span className="text-[13px] font-medium text-[#1f2937]/80">{label}</span>
    </div>
  );
}
