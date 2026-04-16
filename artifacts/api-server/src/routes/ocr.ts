import { Router, IRouter } from "express";
import OpenAI from "openai";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

router.post("/ocr/passport", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { dataUrl } = req.body;

  if (!dataUrl || !dataUrl.startsWith("data:image")) {
    res.status(400).json({ error: "A valid image data URL is required" });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a passport OCR system. Extract the following fields from this passport image and return ONLY a valid JSON object with these keys (use empty string "" if field is not visible or cannot be read):
- firstName: Given name(s) as printed on passport
- lastName: Surname/Family name as printed on passport
- passportNumber: Passport document number (alphanumeric)
- dateOfBirth: Date of birth in YYYY-MM-DD format
- passportExpiry: Passport expiry/valid until date in YYYY-MM-DD format
- gender: "male", "female", or "other"

Return ONLY the JSON object, no explanation, no markdown.`,
            },
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const content = completion.choices[0]?.message?.content?.trim() ?? "{}";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : "{}";

    let extracted: Record<string, string> = {};
    try {
      extracted = JSON.parse(jsonStr);
    } catch {
      extracted = {};
    }

    res.json({
      firstName: extracted.firstName ?? "",
      lastName: extracted.lastName ?? "",
      passportNumber: extracted.passportNumber ?? "",
      dateOfBirth: extracted.dateOfBirth ?? "",
      passportExpiry: extracted.passportExpiry ?? "",
      gender: extracted.gender ?? "",
    });
  } catch (err: any) {
    console.error("OCR error:", err);
    res.status(500).json({ error: "Failed to process passport image" });
  }
});

export default router;
