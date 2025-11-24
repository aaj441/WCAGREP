import { z } from "zod";

// Prospect schemas
export const insertProspectSchema = z.object({
  company: z.string().min(1),
  website: z.string().url(),
  industry: z.string().optional(),
  icpScore: z.number().min(0).max(100).default(50),
  status: z.enum(["discovered", "queued", "scanning", "scanned", "outreach_sent", "active", "converted", "rejected"]).default("discovered"),
  riskLevel: z.enum(["low-risk", "medium-risk", "high-risk"]).default("medium-risk"),
  email: z.string().email().optional(),
  contactName: z.string().optional(),
});

export const updateProspectSchema = insertProspectSchema.partial();

// Violation schemas
export const insertViolationSchema = z.object({
  prospectId: z.string(),
  scanJobId: z.string().optional(),
  type: z.string(),
  severity: z.enum(["critical", "serious", "moderate", "minor"]),
  element: z.string().optional(),
  recommendation: z.string().optional(),
  wcagCriterion: z.string().optional(),
});

// Scan job schemas
export const insertScanJobSchema = z.object({
  url: z.string().url(),
  prospectId: z.string().optional(),
  status: z.enum(["pending", "running", "completed", "failed"]).default("pending"),
  wcagScore: z.number().min(0).max(100).optional(),
  criticalCount: z.number().default(0),
  seriousCount: z.number().default(0),
  moderateCount: z.number().default(0),
  minorCount: z.number().default(0),
  originalHtml: z.string().optional(),
});

// Trigger schemas
export const insertTriggerSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["email", "slack", "webhook"]),
  condition: z.string(),
  isActive: z.boolean().default(true),
  config: z.record(z.any()).optional(),
});

// Client schemas
export const insertClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  apiKey: z.string().optional(),
});

// Do Not Contact schema
export const doNotContactSchema = z.object({
  email: z.string().email().optional(),
  domain: z.string().optional(),
  prospectId: z.string().optional(),
  reason: z.string().min(1),
  permanent: z.boolean().default(true),
});

// Export types
export type InsertProspect = z.infer<typeof insertProspectSchema>;
export type UpdateProspect = z.infer<typeof updateProspectSchema>;
export type InsertViolation = z.infer<typeof insertViolationSchema>;
export type InsertScanJob = z.infer<typeof insertScanJobSchema>;
export type InsertTrigger = z.infer<typeof insertTriggerSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type DoNotContact = z.infer<typeof doNotContactSchema>;

// Mock table for do not contact
export const doNotContact = {
  email: "email",
  domain: "domain",
  prospectId: "prospectId",
  reason: "reason",
  permanent: "permanent",
  createdAt: "createdAt",
};
