import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  countryCode: text("country_code").notNull(),
  countryName: text("country_name").notNull(),
  countryFlag: text("country_flag").notNull(),
  visaType: text("visa_type").notNull(),
  status: text("status").notNull().default("draft"),
  travelDate: text("travel_date"),
  returnDate: text("return_date"),
  purpose: text("purpose"),
  passportNumber: text("passport_number"),
  passportExpiry: text("passport_expiry"),
  nationality: text("nationality"),
  passportIssueDate: text("passport_issue_date"),
  placeOfBirth: text("place_of_birth"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  occupation: text("occupation"),
  hotelName: text("hotel_name"),
  hotelAddress: text("hotel_address"),
  fee: real("fee").notNull().default(0),
  referenceNumber: text("reference_number"),
  notes: text("notes"),
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertApplicationSchema = createInsertSchema(
  applicationsTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
