import { Router } from "express";
import { db } from "@workspace/db";
import { contactMessagesTable } from "@workspace/db/schema";
const router = Router();

router.post("/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    await db
      .insert(contactMessagesTable)
      .values({ name, email, subject, message });
    res
      .status(201)
      .json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
