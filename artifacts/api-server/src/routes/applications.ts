import { Router, IRouter } from "express";
import { eq, and, desc, count } from "drizzle-orm";
import { db, applicationsTable, activityTable } from "@workspace/db";
import {
  CreateApplicationBody,
  UpdateApplicationBody,
  ListApplicationsQueryParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { getCountryByCode } from "../lib/visaData";

const router: IRouter = Router();

function generateRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "VP";
  for (let i = 0; i < 8; i++) {
    ref += chars[Math.floor(Math.random() * chars.length)];
  }
  return ref;
}

router.get("/applications", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const query = ListApplicationsQueryParams.safeParse(req.query);
  const status = query.success ? query.data.status : undefined;
  const limit = (query.success && query.data.limit) ? Number(query.data.limit) : 20;
  const offset = (query.success && query.data.offset) ? Number(query.data.offset) : 0;

  let conditions = [eq(applicationsTable.userId, req.userId!)];
  if (status && status !== "all") {
    conditions.push(eq(applicationsTable.status, status));
  }

  const [apps, totalResult] = await Promise.all([
    db
      .select()
      .from(applicationsTable)
      .where(and(...conditions))
      .orderBy(desc(applicationsTable.updatedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(applicationsTable)
      .where(and(...conditions)),
  ]);

  const total = totalResult[0]?.count ?? 0;

  res.json({
    applications: apps.map(formatApp),
    total,
    limit,
    offset,
  });
});

router.post("/applications", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const country = getCountryByCode(parsed.data.countryCode);
  if (!country) {
    res.status(400).json({ error: "Invalid country code" });
    return;
  }

  const visaType = country.visaTypes.find((v) => v.type === parsed.data.visaType);
  if (!visaType) {
    res.status(400).json({ error: "Invalid visa type for this country" });
    return;
  }

  const [app] = await db
    .insert(applicationsTable)
    .values({
      userId: req.userId!,
      countryCode: country.code,
      countryName: country.name,
      countryFlag: country.flag,
      visaType: visaType.type,
      status: "draft",
      travelDate: parsed.data.travelDate ?? null,
      returnDate: parsed.data.returnDate ?? null,
      purpose: parsed.data.purpose ?? null,
      fee: visaType.fee,
    })
    .returning();

  await db.insert(activityTable).values({
    userId: req.userId!,
    type: "application_created",
    applicationId: app.id,
    countryName: country.name,
    countryFlag: country.flag,
    description: `Started ${visaType.label} application for ${country.name}`,
  });

  res.status(201).json(formatApp(app));
});

router.get("/applications/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
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

  res.json(formatApp(app));
});

router.put("/applications/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid application ID" });
    return;
  }

  const parsed = UpdateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(applicationsTable)
    .where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, req.userId!)));

  if (!existing) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  if (existing.status !== "draft") {
    res.status(400).json({ error: "Only draft applications can be updated" });
    return;
  }

  const [updated] = await db
    .update(applicationsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(applicationsTable.id, id))
    .returning();

  res.json(formatApp(updated));
});

router.delete("/applications/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid application ID" });
    return;
  }

  const [existing] = await db
    .select()
    .from(applicationsTable)
    .where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, req.userId!)));

  if (!existing) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  if (existing.status !== "draft") {
    res.status(400).json({ error: "Only draft applications can be deleted" });
    return;
  }

  await db.delete(applicationsTable).where(eq(applicationsTable.id, id));
  res.sendStatus(204);
});

router.post("/applications/:id/submit", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid application ID" });
    return;
  }

  const [existing] = await db
    .select()
    .from(applicationsTable)
    .where(and(eq(applicationsTable.id, id), eq(applicationsTable.userId, req.userId!)));

  if (!existing) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  if (existing.status !== "draft") {
    res.status(400).json({ error: "Application is not in draft status" });
    return;
  }

  const referenceNumber = generateRef();

  const [updated] = await db
    .update(applicationsTable)
    .set({
      status: "submitted",
      referenceNumber,
      submittedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(applicationsTable.id, id))
    .returning();

  await db.insert(activityTable).values({
    userId: req.userId!,
    type: "application_submitted",
    applicationId: id,
    countryName: existing.countryName,
    countryFlag: existing.countryFlag,
    description: `Application submitted for ${existing.countryName} — Ref: ${referenceNumber}`,
  });

  // Simulate processing: after a delay move to under_review
  setTimeout(async () => {
    await db
      .update(applicationsTable)
      .set({ status: "under_review", updatedAt: new Date() })
      .where(eq(applicationsTable.id, id));

    await db.insert(activityTable).values({
      userId: existing.userId,
      type: "status_changed",
      applicationId: id,
      countryName: existing.countryName,
      countryFlag: existing.countryFlag,
      description: `Application for ${existing.countryName} is now under review`,
    });
  }, 10000);

  res.json(formatApp(updated));
});

function formatApp(app: typeof applicationsTable.$inferSelect) {
  return {
    id: app.id,
    userId: app.userId,
    countryCode: app.countryCode,
    countryName: app.countryName,
    countryFlag: app.countryFlag,
    visaType: app.visaType,
    status: app.status,
    travelDate: app.travelDate,
    returnDate: app.returnDate,
    purpose: app.purpose,
    passportNumber: app.passportNumber,
    passportExpiry: app.passportExpiry,
    firstName: app.firstName,
    lastName: app.lastName,
    dateOfBirth: app.dateOfBirth,
    gender: app.gender,
    occupation: app.occupation,
    hotelName: app.hotelName,
    hotelAddress: app.hotelAddress,
    fee: app.fee,
    referenceNumber: app.referenceNumber,
    notes: app.notes,
    submittedAt: app.submittedAt?.toISOString() ?? null,
    approvedAt: app.approvedAt?.toISOString() ?? null,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  };
}

export default router;
