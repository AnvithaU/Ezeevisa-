import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";

const router = Router();

router.get("/reviews", async (req, res) => {
  try {
    const allReviews = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.isApproved, true))
      .orderBy(desc(reviewsTable.createdAt));
    res.status(200).json(allReviews);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

router.post("/reviews", async (req, res) => {
  try {
    const { name, destination, text, rating } = req.body;
    await db
      .insert(reviewsTable)
      .values({ name, destination, text, rating: rating || 5 });
    res
      .status(201)
      .json({ success: true, message: "Review submitted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to submit review" });
  }
});

export default router;
