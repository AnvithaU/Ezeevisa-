import { Router, IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, applicationsTable, activityTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const apps = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.userId, req.userId!));

  const total = apps.length;
  const draft = apps.filter((a) => a.status === "draft").length;
  const submitted = apps.filter((a) => a.status === "submitted").length;
  const underReview = apps.filter((a) => a.status === "under_review").length;
  const approved = apps.filter((a) => a.status === "approved").length;
  const rejected = apps.filter((a) => a.status === "rejected").length;

  const recentCountries = [
    ...new Set(
      apps
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 5)
        .map((a) => `${a.countryFlag} ${a.countryName}`)
    ),
  ];

  const decidedApps = approved + rejected;
  const successRate = decidedApps > 0 ? (approved / decidedApps) * 100 : 0;

  res.json({
    totalApplications: total,
    pending: submitted + underReview,
    approved,
    rejected,
    drafts: draft,
    recentCountries,
    successRate: Math.round(successRate),
  });
});

router.get("/dashboard/recent-activity", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const limit = parseInt(String(req.query.limit || "10"), 10);

  const activities = await db
    .select()
    .from(activityTable)
    .where(eq(activityTable.userId, req.userId!))
    .orderBy(desc(activityTable.timestamp))
    .limit(limit);

  res.json(
    activities.map((a) => ({
      id: a.id,
      type: a.type,
      applicationId: a.applicationId,
      countryName: a.countryName,
      countryFlag: a.countryFlag,
      description: a.description,
      timestamp: a.timestamp.toISOString(),
    }))
  );
});

export default router;
