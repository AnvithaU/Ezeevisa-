import axios from "axios";
import { Router, IRouter } from "express";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.post(
  "/ocr/passport",
  requireAuth,
  async (req: AuthRequest, res): Promise<void> => {
    const { files } = req.body;
    console.log("OCR REQUEST RECEIVED");

    if (!files || !Array.isArray(files) || files.length === 0) {
      res.status(400).json({
        error: "At least one file is required",
      });
      return;
    }

    if (files.length > 5) {
      res.status(400).json({
        error: "Maximum 5 files allowed",
      });
      return;
    }

    try {
      // Validate each uploaded file
      for (const file of files) {
        // Must be a string image data URL
        if (typeof file !== "string" || !file.startsWith("data:image/")) {
          res.status(400).json({
            error: "Invalid file format. Only image files are allowed.",
          });
          return;
        }

        // Extract base64 content safely
        const base64Data = file.split(",")[1] || "";

        // Reject malformed data URLs
        if (!base64Data) {
          res.status(400).json({
            error: "Invalid image data",
          });
          return;
        }

        // Check file size (10MB max)
        const sizeInBytes = Buffer.byteLength(base64Data, "base64");

        if (sizeInBytes > 10 * 1024 * 1024) {
          res.status(400).json({
            error: "File exceeds 10MB limit",
          });
          return;
        }
      }

      // Forward the request to your Python backend
      const response = await axios.post(
        "http://127.0.0.1:5001/extract-passport",
        { files },
      );

      console.log("PYTHON OCR RESPONSE");
      console.log(response.data);

      let extracted = response.data;

      const isValidDate = (value?: string) =>
        !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);

      try {
        const confidence = Number(extracted.confidence ?? 0);

        extracted.confidence = Number.isFinite(confidence)
          ? confidence > 1
            ? confidence / 100
            : confidence
          : 0;

        if (!isValidDate(extracted.dateOfBirth)) extracted.dateOfBirth = "";
        if (!isValidDate(extracted.passportExpiry))
          extracted.passportExpiry = "";
        if (!isValidDate(extracted.passportIssueDate))
          extracted.passportIssueDate = "";

        if (extracted.passportExpiry) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const expiryDate = new Date(extracted.passportExpiry);
          expiryDate.setHours(0, 0, 0, 0);

          extracted.isExpired = expiryDate < today;
        }

        if (extracted.gender) {
          const gender = extracted.gender.toLowerCase();

          if (gender.startsWith("m")) extracted.gender = "male";
          else if (gender.startsWith("f")) extracted.gender = "female";
          else extracted.gender = "other";
        }

        const quality = extracted.documentQuality?.toLowerCase();
        if (
          quality !== "good" &&
          quality !== "acceptable" &&
          quality !== "poor"
        ) {
          extracted.documentQuality = "acceptable";
        }
      } catch {
        extracted = {};
      }

      console.log({
        passportNumber: "***",
        firstName: extracted.firstName,
      });

      res.json({
        firstName: extracted.firstName ?? "",
        lastName: extracted.lastName ?? "",
        passportNumber:
          extracted.passportNumber?.replace(/\s/g, "").toUpperCase() ?? "",
        dateOfBirth: extracted.dateOfBirth ?? "",
        passportExpiry: extracted.passportExpiry ?? "",
        passportIssueDate: extracted.passportIssueDate ?? "",
        gender: extracted.gender ?? "",
        nationality: extracted.nationality ?? "",
        placeOfBirth: extracted.placeOfBirth ?? "",
        mrzDetected: extracted.mrzDetected ?? false,
        confidence: extracted.confidence ?? 0,
        documentQuality: extracted.documentQuality ?? "good",
        isExpired: extracted.isExpired ?? false,
        isBlurry: extracted.isBlurry ?? false,
        isCutOff: extracted.isCutOff ?? false,
        hasGlare: extracted.hasGlare ?? false,
        validationMessage:
          extracted.validationMessage || "Passport image quality is acceptable",
      });
    } catch (err: any) {
      console.error("OCR error:", err);
      res.status(500).json({ error: "Failed to process passport image" });
    }
  },
);

export default router;
