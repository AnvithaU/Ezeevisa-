import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const otpPurposeEnum = pgEnum("otp_purpose", [
  "email_verification",
  "login",
]);

export const otpCodesTable = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  codeHash: text("code").notNull(),
  purpose: otpPurposeEnum("purpose").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type OtpCode = typeof otpCodesTable.$inferSelect;
export type OtpPurpose = (typeof otpPurposeEnum.enumValues)[number];
