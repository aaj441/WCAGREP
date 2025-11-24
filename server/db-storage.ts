import { sql } from "./db";
import type { InsertProspect, InsertViolation, InsertScanJob, InsertTrigger, InsertClient } from "@shared/schema";

class Storage {
  // Prospects
  async getProspects() {
    return await sql`SELECT * FROM prospects ORDER BY created_at DESC`;
  }

  async getProspect(id: string) {
    const [prospect] = await sql`SELECT * FROM prospects WHERE id = ${id}`;
    return prospect;
  }

  async createProspect(data: InsertProspect) {
    const [prospect] = await sql`
      INSERT INTO prospects ${sql(data as any)}
      RETURNING *
    `;
    return prospect;
  }

  async updateProspect(id: string, data: Partial<InsertProspect>) {
    const [prospect] = await sql`
      UPDATE prospects
      SET ${sql(data as any)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return prospect;
  }

  async deleteProspect(id: string) {
    const [deleted] = await sql`DELETE FROM prospects WHERE id = ${id} RETURNING *`;
    return !!deleted;
  }

  // Scan Jobs
  async getScanJob(id: string) {
    const [job] = await sql`SELECT * FROM scan_jobs WHERE id = ${id}`;
    return job;
  }

  async createScanJob(data: InsertScanJob) {
    const [job] = await sql`
      INSERT INTO scan_jobs ${sql(data as any)}
      RETURNING *
    `;
    return job;
  }

  async updateScanJob(id: string, data: Partial<InsertScanJob>) {
    const [job] = await sql`
      UPDATE scan_jobs
      SET ${sql(data as any)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return job;
  }

  async getScanResultsByScanJob(scanJobId: string) {
    return await sql`SELECT * FROM violations WHERE scan_job_id = ${scanJobId}`;
  }

  async getAuditReports() {
    return await sql`
      SELECT sj.*, p.company, p.website
      FROM scan_jobs sj
      LEFT JOIN prospects p ON sj.prospect_id = p.id
      WHERE sj.status = 'completed'
      ORDER BY sj.created_at DESC
    `;
  }

  // Violations
  async getViolationsByProspect(prospectId: string) {
    return await sql`SELECT * FROM violations WHERE prospect_id = ${prospectId}`;
  }

  async createViolation(data: InsertViolation) {
    const [violation] = await sql`
      INSERT INTO violations ${sql(data as any)}
      RETURNING *
    `;
    return violation;
  }

  // Triggers
  async getTriggers(isActive?: boolean) {
    if (isActive !== undefined) {
      return await sql`SELECT * FROM triggers WHERE is_active = ${isActive}`;
    }
    return await sql`SELECT * FROM triggers`;
  }

  async createTrigger(data: InsertTrigger) {
    const [trigger] = await sql`
      INSERT INTO triggers ${sql(data as any)}
      RETURNING *
    `;
    return trigger;
  }

  async updateTrigger(id: string, data: Partial<InsertTrigger>) {
    const [trigger] = await sql`
      UPDATE triggers
      SET ${sql(data as any)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return trigger;
  }

  async deleteTrigger(id: string) {
    const [deleted] = await sql`DELETE FROM triggers WHERE id = ${id} RETURNING *`;
    return !!deleted;
  }

  // Email Cadences
  async getEmailCadencesByProspect(prospectId: string) {
    // Placeholder - return empty for now
    return [];
  }

  // Analytics
  async getAnalytics(startDate: Date, endDate: Date) {
    // Placeholder - return mock data
    return [];
  }

  // Clients
  async getClients() {
    return await sql`SELECT * FROM clients ORDER BY created_at DESC`;
  }

  async createClient(data: InsertClient) {
    const [client] = await sql`
      INSERT INTO clients ${sql(data as any)}
      RETURNING *
    `;
    return client;
  }

  async updateClient(id: string, data: Partial<InsertClient>) {
    const [client] = await sql`
      UPDATE clients
      SET ${sql(data as any)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return client;
  }
}

export const storage = new Storage();
