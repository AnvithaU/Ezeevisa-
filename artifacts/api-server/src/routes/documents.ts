import { Router, IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, applicationsTable, documentsTable, activityTable } from "@workspace/db";
import { UploadDocumentBody } from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import path from "path";
import fs from "fs/promises";

const router: IRouter = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

async function ensureUploadsDir(): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

router.get("/applications/:id/documents", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid application ID" });
    return;
  }

  const [app] = await db
    .select()
    .from(applicationsTable)
    .where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, req.userId!)));

  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const docs = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.applicationId, id));

  res.json(
    docs.map((d) => ({
      id: d.id,
      applicationId: d.applicationId,
      type: d.type,
      filename: d.filename,
      originalName: d.originalName,
      mimeType: d.mimeType,
      size: d.size,
      url: d.url,
      uploadedAt: d.uploadedAt.toISOString(),
    }))
  );
});

router.post("/applications/:id/documents", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid application ID" });
    return;
  }

  const [app] = await db
    .select()
    .from(applicationsTable)
    .where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, req.userId!)));

  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const parsed = UploadDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { type, filename, originalName, mimeType, size, dataUrl } = parsed.data;

  await ensureUploadsDir();

  const ext = path.extname(originalName) || ".bin";
  const savedFilename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const filePath = path.join(UPLOADS_DIR, savedFilename);

  const base64Data = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  await fs.writeFile(filePath, Buffer.from(base64Data, "base64"));

  const url = `/api/uploads/${savedFilename}`;

  const [doc] = await db
    .insert(documentsTable)
    .values({
      applicationId: id,
      type,
      filename: savedFilename,
      originalName,
      mimeType,
      size,
      url,
    })
    .returning();

  await db.insert(activityTable).values({
    userId: req.userId!,
    type: "document_uploaded",
    applicationId: id,
    countryName: app.countryName,
    countryFlag: app.countryFlag,
    description: `Uploaded ${type.replace(/_/g, " ")} for ${app.countryName} application`,
  });

  res.status(201).json({
    id: doc.id,
    applicationId: doc.applicationId,
    type: doc.type,
    filename: doc.filename,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    size: doc.size,
    url: doc.url,
    uploadedAt: doc.uploadedAt.toISOString(),
  });
});

router.delete("/applications/:id/documents/:docId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rawDocId = Array.isArray(req.params.docId) ? req.params.docId[0] : req.params.docId;
  const id = parseInt(rawId, 10);
  const docId = parseInt(rawDocId, 10);

  if (isNaN(id) || isNaN(docId)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [app] = await db
    .select()
    .from(applicationsTable)
    .where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, req.userId!)));

  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(and(eq(documentsTable.id, docId), eq(documentsTable.applicationId, id)));

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const filePath = path.join(UPLOADS_DIR, doc.filename);
  await fs.unlink(filePath).catch(() => {});

  await db.delete(documentsTable).where(eq(documentsTable.id, docId));
  res.sendStatus(204);
});

export default router;
