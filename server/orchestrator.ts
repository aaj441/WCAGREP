import { storage } from "./db-storage";
import { wcagScanner } from "./services/wcag-scanner";
import { emailService } from "./services/email-service";
import { logger } from "./logger";
import { nanoid } from "nanoid";

class ScanOrchestrator {
  async queueAndRunScan(url: string, companyName?: string, prospectEmail?: string) {
    try {
      // Create scan job
      const scanJob = await storage.createScanJob({
        url,
        status: "pending",
      });

      logger.info(`Scan job created: ${scanJob.id}`);

      // Run scan asynchronously (don't await)
      this.runScan(scanJob.id, url, companyName, prospectEmail).catch(error => {
        logger.error(`Scan failed for job ${scanJob.id}`, error);
      });

      return scanJob;
    } catch (error) {
      logger.error("Failed to queue scan", error as Error);
      throw error;
    }
  }

  private async runScan(scanJobId: string, url: string, companyName?: string, prospectEmail?: string) {
    try {
      // Update status to running
      await storage.updateScanJob(scanJobId, { status: "running" });

      // Run WCAG scan
      const results = await wcagScanner.scanWebsite(url);

      // Update scan job with results
      await storage.updateScanJob(scanJobId, {
        status: "completed",
        wcagScore: results.wcagScore,
        criticalCount: results.criticalCount,
        seriousCount: results.seriousCount,
        moderateCount: results.moderateCount,
        minorCount: results.minorCount,
        originalHtml: results.originalHtml,
      });

      // Store violations
      for (const violation of results.violations) {
        await storage.createViolation({
          scanJobId,
          prospectId: "", // Will be linked if prospect exists
          type: violation.type,
          severity: violation.severity,
          element: violation.element,
          recommendation: violation.recommendation,
          wcagCriterion: violation.wcagCriterion,
        });
      }

      logger.info(`Scan completed successfully: ${scanJobId}`);
    } catch (error) {
      logger.error(`Scan execution failed: ${scanJobId}`, error as Error);
      await storage.updateScanJob(scanJobId, { status: "failed" });
    }
  }

  async sendOutreach(prospectEmail: string, companyName: string): Promise<boolean> {
    try {
      const success = await emailService.sendOutreachEmail(
        prospectEmail,
        "there",
        companyName
      );
      return success;
    } catch (error) {
      logger.error("Outreach failed", error as Error);
      return false;
    }
  }
}

export const scanOrchestrator = new ScanOrchestrator();
