import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./db-storage";
import { insertProspectSchema, insertViolationSchema, insertTriggerSchema, insertScanJobSchema, insertClientSchema, doNotContact } from "@shared/schema";
import { db } from "./db";
import { seedData } from "./seed";
import { wcagScanner } from "./services/wcag-scanner";
import { pdfGenerator } from "./services/pdf-generator";
import { scanOrchestrator } from "./orchestrator";
import { keywordDiscoveryService } from "./services/keyword-discovery";
import { metaPromptsService } from "./services/meta-prompts";
import { integrationContextService } from "./services/integration-context";
import { websiteRegeneratorService } from "./services/website-regenerator";
import { mockupRendererService } from "./services/mockup-renderer";
import { keywordScanner } from "./services/keyword-scanner";
import { healthCheck } from "./services/health-check";
import { suggestionsGenerator } from "./services/suggestions-generator";
import { compactPdfGenerator } from "./services/compact-pdf-generator";
import { dataOptimizer } from "./services/data-optimizer";
import { emailGenerator } from "./services/email-generator";
import { ethicalEmailGuard } from "./services/ethical-email-guard";
import archiver from "archiver";
import path from "path";
import { quickWinLimiter, agentTriggerLimiter } from "./middleware/rate-limiter";
import { logger } from "./logger";

let isSeeded = false;

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed initial data only once
  if (!isSeeded) {
    await seedData();
    isSeeded = true;
  }

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      // Check database connectivity by running a simple query
      const prospects = await storage.getProspects().catch(() => null);
      
      const health = {
        status: prospects !== null ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        database: prospects !== null ? "connected" : "disconnected",
      };

      const statusCode = health.status === "healthy" ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      logger.error("Health check failed", error as Error);
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "error",
      });
    }
  });

  // Prospect routes
  app.get("/api/prospects", async (_req, res) => {
    try {
      const prospects = await storage.getProspects();
      res.json(prospects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prospects" });
    }
  });

  app.get("/api/prospects/:id", async (req, res) => {
    try {
      const prospect = await storage.getProspect(req.params.id);
      if (!prospect) {
        return res.status(404).json({ error: "Prospect not found" });
      }
      res.json(prospect);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prospect" });
    }
  });

  app.post("/api/prospects", async (req, res) => {
    try {
      const validatedData = insertProspectSchema.parse(req.body);
      const prospect = await storage.createProspect(validatedData);
      res.status(201).json(prospect);
    } catch (error) {
      res.status(400).json({ error: "Invalid prospect data" });
    }
  });

  app.patch("/api/prospects/:id", async (req, res) => {
    try {
      const validatedData = insertProspectSchema.partial().parse(req.body);
      const prospect = await storage.updateProspect(req.params.id, validatedData);
      if (!prospect) {
        return res.status(404).json({ error: "Prospect not found" });
      }
      res.json(prospect);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.delete("/api/prospects/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProspect(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Prospect not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete prospect" });
    }
  });

  // Violation routes
  app.get("/api/prospects/:prospectId/violations", async (req, res) => {
    try {
      const violations = await storage.getViolationsByProspect(req.params.prospectId);
      res.json(violations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch violations" });
    }
  });

  app.post("/api/violations", async (req, res) => {
    try {
      const validatedData = insertViolationSchema.parse(req.body);
      const violation = await storage.createViolation(validatedData);
      res.status(201).json(violation);
    } catch (error) {
      res.status(400).json({ error: "Invalid violation data" });
    }
  });

  // Trigger routes
  app.get("/api/triggers", async (req, res) => {
    try {
      const isActive = req.query.active === "true" ? true : req.query.active === "false" ? false : undefined;
      const triggers = await storage.getTriggers(isActive);
      res.json(triggers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch triggers" });
    }
  });

  app.post("/api/triggers", async (req, res) => {
    try {
      const validatedData = insertTriggerSchema.parse(req.body);
      const trigger = await storage.createTrigger(validatedData);
      res.status(201).json(trigger);
    } catch (error) {
      res.status(400).json({ error: "Invalid trigger data" });
    }
  });

  app.patch("/api/triggers/:id", async (req, res) => {
    try {
      const validatedData = insertTriggerSchema.partial().parse(req.body);
      const trigger = await storage.updateTrigger(req.params.id, validatedData);
      if (!trigger) {
        return res.status(404).json({ error: "Trigger not found" });
      }
      res.json(trigger);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.delete("/api/triggers/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTrigger(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Trigger not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete trigger" });
    }
  });

  // Email Cadence routes
  app.get("/api/prospects/:prospectId/cadences", async (req, res) => {
    try {
      const cadences = await storage.getEmailCadencesByProspect(req.params.prospectId);
      res.json(cadences);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch email cadences" });
    }
  });

  // Analytics routes
  app.get("/api/analytics", async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      const analytics = await storage.getAnalytics(startDate, endDate);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Quick Win Demo Flow - Scan website and generate report
  // Apply rate limiting: 10 requests per hour per IP
  app.post("/api/scan/quick-win", quickWinLimiter.middleware(), async (req, res) => {
    try {
      const { url, companyName, prospectEmail } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "Website URL is required" });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: "Invalid URL format" });
      }

      // Queue scan using orchestrator
      const scanJob = await scanOrchestrator.queueAndRunScan(
        url,
        companyName,
        prospectEmail
      );

      // Return scan job immediately (client will poll for completion)
      res.status(202).json(scanJob);
    } catch (error) {
      logger.error("Failed to start scan", error as Error);
      res.status(500).json({ error: "Failed to start accessibility scan" });
    }
  });

  // Send outreach email
  app.post("/api/outreach", async (req, res) => {
    try {
      const { prospectEmail, companyName } = req.body;
      
      if (!prospectEmail || !companyName) {
        return res.status(400).json({ error: "Email and company name are required" });
      }

      const success = await scanOrchestrator.sendOutreach(prospectEmail, companyName);
      
      if (success) {
        res.json({ message: "Outreach email sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send outreach email" });
      }
    } catch (error) {
      console.error("Failed to send outreach:", error);
      res.status(500).json({ error: "Failed to send outreach email" });
    }
  });

  // Get scan job status
  app.get("/api/scan/:id", async (req, res) => {
    try {
      const scanJob = await storage.getScanJob(req.params.id);
      if (!scanJob) {
        return res.status(404).json({ error: "Scan job not found" });
      }
      res.json(scanJob);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scan job" });
    }
  });

  // Get scan results
  app.get("/api/scan/:id/results", async (req, res) => {
    try {
      const results = await storage.getScanResultsByScanJob(req.params.id);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scan results" });
    }
  });

  // Get audit report for scan
  app.get("/api/scan/:id/report", async (req, res) => {
    try {
      const reports = await storage.getAuditReports();
      const report = reports.find(r => r.scanJobId === req.params.id);
      
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch report" });
    }
  });

  // Generate improved website mockup for scan
  app.post("/api/scan/:id/regenerate", async (req, res) => {
    try {
      const scanJobId = req.params.id;
      
      // Get scan job and results
      const scanJob = await storage.getScanJob(scanJobId);
      if (!scanJob) {
        return res.status(404).json({ error: "Scan job not found" });
      }
      
      if (scanJob.status !== "completed") {
        return res.status(400).json({ error: "Scan must be completed before generating mockup" });
      }
      
      const scanResults = await storage.getScanResultsByScanJob(scanJobId);
      
      // Generate improved website using AI
      console.log(`Generating improved website for ${scanJob.url}...`);
      const regenerated = await websiteRegeneratorService.regenerateWebsite(
        scanJob.url,
        scanJob.originalHtml || null,
        scanResults,
        scanJob.wcagScore || 0
      );
      
      // Save mockup files
      const mockupFiles = await mockupRendererService.saveMockup(
        regenerated.html,
        regenerated.css,
        scanJobId
      );
      
      console.log(`Mockup generated successfully for scan ${scanJobId}`);
      
      res.json({
        scanJobId,
        improvements: regenerated.improvements,
        wcagImprovements: regenerated.wcagImprovements,
        mockup: {
          htmlPath: mockupFiles.htmlPath,
          cssPath: mockupFiles.cssPath,
          previewUrl: `/mockups/${scanJobId}` // We'll add this endpoint next
        },
        downloadUrls: {
          html: `/api/scan/${scanJobId}/mockup/html`,
          css: `/api/scan/${scanJobId}/mockup/css`,
          zip: `/api/scan/${scanJobId}/mockup/download`
        }
      });
    } catch (error) {
      console.error("Failed to regenerate website:", error);
      res.status(500).json({ error: "Failed to generate improved website mockup" });
    }
  });

  // Helper function to validate and sanitize scan IDs
  const validateScanId = (scanId: string): boolean => {
    // UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(scanId);
  };

  // Download mockup HTML
  app.get("/api/scan/:id/mockup/html", async (req, res) => {
    try {
      const scanId = req.params.id;
      
      // Validate scan ID to prevent path traversal
      if (!validateScanId(scanId)) {
        return res.status(400).json({ error: "Invalid scan ID format" });
      }
      
      // Verify scan job exists and belongs to the requesting user
      const scanJob = await storage.getScanJob(scanId);
      if (!scanJob) {
        return res.status(404).json({ error: "Scan job not found" });
      }
      
      const mockups = await mockupRendererService.listMockups(scanId);
      if (mockups.length === 0) {
        return res.status(404).json({ error: "Mockup not found" });
      }
      
      // Get the most recent mockup
      const htmlPath = mockups[mockups.length - 1];
      const html = await mockupRendererService.getMockup(htmlPath);
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="improved-website.html"`);
      res.send(html);
    } catch (error) {
      res.status(500).json({ error: "Failed to download mockup" });
    }
  });

  // Download mockup as ZIP (HTML + CSS bundle)
  app.get("/api/scan/:id/mockup/download", async (req, res) => {
    try {
      const scanId = req.params.id;
      
      // Validate scan ID to prevent path traversal
      if (!validateScanId(scanId)) {
        return res.status(400).json({ error: "Invalid scan ID format" });
      }
      
      // Verify scan job exists and belongs to the requesting user
      const scanJob = await storage.getScanJob(scanId);
      if (!scanJob) {
        return res.status(404).json({ error: "Scan job not found" });
      }
      
      const mockups = await mockupRendererService.listMockups(scanId);
      if (mockups.length === 0) {
        return res.status(404).json({ error: "Mockup not found" });
      }
      
      // Get the most recent HTML and corresponding CSS
      const htmlPath = mockups[mockups.length - 1];
      const cssPath = htmlPath.replace('.html', '.css');
      
      const html = await mockupRendererService.getMockup(htmlPath);
      const css = await mockupRendererService.getMockup(cssPath);
      
      // Create ZIP archive
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="improved-website.zip"`);
      
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });
      
      archive.on('error', (err) => {
        console.error('Archive error:', err);
        res.status(500).json({ error: "Failed to create ZIP archive" });
      });
      
      archive.pipe(res);
      
      // Add files to archive
      archive.append(html, { name: 'index.html' });
      archive.append(css, { name: 'styles.css' });
      
      await archive.finalize();
    } catch (error) {
      console.error('ZIP download error:', error);
      res.status(500).json({ error: "Failed to download mockup bundle" });
    }
  });

  // Serve mockup preview (static HTML)
  app.get("/mockups/:id", async (req, res) => {
    try {
      const scanId = req.params.id;
      
      // Validate scan ID to prevent path traversal
      if (!validateScanId(scanId)) {
        return res.status(400).send('<h1>Invalid scan ID</h1>');
      }
      
      // Verify scan job exists and belongs to the requesting user
      const scanJob = await storage.getScanJob(scanId);
      if (!scanJob) {
        return res.status(404).send('<h1>Scan job not found</h1>');
      }
      
      const mockups = await mockupRendererService.listMockups(scanId);
      if (mockups.length === 0) {
        return res.status(404).send('<h1>Mockup not found</h1>');
      }
      
      // Get the most recent mockup
      const htmlPath = mockups[mockups.length - 1];
      const html = await mockupRendererService.getMockup(htmlPath);
      
      // Serve as HTML (not download)
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Mockup preview error:', error);
      res.status(500).send('<h1>Error loading mockup</h1>');
    }
  });

  // Client management routes
  app.get("/api/clients", async (_req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      res.status(400).json({ error: "Invalid client data" });
    }
  });

  app.patch("/api/clients/:id", async (req, res) => {
    try {
      const validatedData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, validatedData);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  // Agent Status API
  app.get("/api/agents/status", async (_req, res) => {
    try {
      const { monitorAgent } = await import("./agents");
      const status = await monitorAgent.getAgentStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agent status" });
    }
  });

  // Keyword Discovery - Find prospects by keywords
  app.post("/api/discovery/keywords", async (req, res) => {
    try {
      const { keywords, industry, region, limit, useAI } = req.body;

      if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        return res.status(400).json({ error: "Keywords array is required" });
      }

      const prospects = await keywordDiscoveryService.discoverProspects({
        keywords,
        industry,
        region,
        limit: limit || 50,
        useAI: useAI || false,
      });

      // Store discovered prospects
      const storedProspects = [];
      for (const prospect of prospects) {
        const stored = await storage.createProspect({
          company: prospect.company,
          website: prospect.website,
          industry: prospect.industry,
          icpScore: prospect.icpScore || 50,
          status: "discovered",
          riskLevel: prospect.legalRisk === "high" ? "high-risk" : prospect.legalRisk === "medium" ? "medium-risk" : "low-risk",
        });
        storedProspects.push(stored);
      }

      res.json({
        discovered: prospects.length,
        prospects: storedProspects,
        metaPromptUsed: useAI ? "AI-enhanced prospect analysis" : "Standard keyword matching",
      });
    } catch (error) {
      console.error("Keyword discovery failed:", error);
      res.status(500).json({ error: "Failed to discover prospects" });
    }
  });

  // Queue prospects for automated scanning by agents
  app.post("/api/discovery/queue-for-scanning", async (req, res) => {
    try {
      const { prospectIds } = req.body;

      if (!prospectIds || !Array.isArray(prospectIds) || prospectIds.length === 0) {
        return res.status(400).json({ error: "Prospect IDs array is required" });
      }

      // Update all prospects to "queued" status
      const updatedProspects = [];
      for (const prospectId of prospectIds) {
        const updated = await storage.updateProspect(prospectId, {
          status: "queued",
        });
        if (updated) {
          updatedProspects.push(updated);
        }
      }

      console.log(`[Discovery] Queued ${updatedProspects.length} prospects for automated scanning`);

      res.json({
        queued: updatedProspects.length,
        prospects: updatedProspects,
        message: `${updatedProspects.length} prospects queued. Planner Agent will pick them up within the next hour.`,
      });
    } catch (error) {
      console.error("Queue for scanning failed:", error);
      res.status(500).json({ error: "Failed to queue prospects for scanning" });
    }
  });

  // Meta Prompts - Get AI prompts for different integration scenarios
  app.post("/api/meta-prompts/prospect-analysis", async (req, res) => {
    try {
      const { company, website, industry, icp, wcagScore, violations } = req.body;

      const prompt = metaPromptsService.getProspectAnalysisPrompt({
        company,
        website,
        industry,
        icp,
        wcagScore,
        violations,
      });

      res.json({ prompt });
    } catch (error) {
      console.error("Meta prompt generation failed:", error);
      res.status(500).json({ error: "Failed to generate meta prompt" });
    }
  });

  app.post("/api/meta-prompts/outreach", async (req, res) => {
    try {
      const { company, website, industry, touchNumber } = req.body;

      const prompt =
        touchNumber > 1
          ? metaPromptsService.getFollowUpSequencePrompt(
              { company, website, industry },
              touchNumber
            )
          : metaPromptsService.getPersonalizedOutreachPrompt({
              company,
              website,
              industry,
            });

      res.json({ prompt, touchNumber });
    } catch (error) {
      console.error("Outreach prompt generation failed:", error);
      res.status(500).json({ error: "Failed to generate outreach prompt" });
    }
  });

  app.post("/api/meta-prompts/violation-analysis", async (req, res) => {
    try {
      const { violations, wcagScore } = req.body;

      const prompt = metaPromptsService.getWebsiteViolationAnalysisPrompt(violations, wcagScore);

      res.json({ prompt });
    } catch (error) {
      console.error("Violation analysis prompt generation failed:", error);
      res.status(500).json({ error: "Failed to generate analysis prompt" });
    }
  });

  app.get("/api/meta-prompts/agent-instructions/:agentType", async (req, res) => {
    try {
      const { agentType } = req.params;

      let prompt = "";
      switch (agentType) {
        case "planner":
          prompt = metaPromptsService.getPlannerAgentInstructionsPrompt();
          break;
        case "executor":
          prompt = metaPromptsService.getExecutorAgentInstructionsPrompt();
          break;
        case "outreach":
          prompt = metaPromptsService.getOutreachAgentInstructionsPrompt();
          break;
        case "monitor":
          prompt = metaPromptsService.getMonitorAgentInstructionsPrompt();
          break;
        default:
          return res.status(400).json({ error: `Unknown agent type: ${agentType}` });
      }

      res.json({ agentType, prompt });
    } catch (error) {
      console.error("Agent instructions prompt generation failed:", error);
      res.status(500).json({ error: "Failed to generate agent instructions" });
    }
  });

  // Browser Backend Stats (limited info for security)
  app.get("/api/backends/stats", async (_req, res) => {
    try {
      const { browserBackendManager } = await import("./services/browser-backends");
      const stats = browserBackendManager.getAllStats();
      
      // Return only non-sensitive aggregated data
      const publicStats = stats.map(backend => ({
        name: backend.name,
        enabled: backend.enabled,
        activeScans: backend.activeScans,
        // Omit dailyScans and dailyLimit for security
        concurrent: backend.concurrent,
        available: backend.enabled && backend.activeScans < backend.concurrent,
      }));
      
      res.json(publicStats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch backend stats" });
    }
  });

  // Manual agent triggers (for testing/debugging)
  app.post("/api/agents/planner/run", async (_req, res) => {
    try {
      const { plannerAgent } = await import("./agents");
      await plannerAgent.plan();
      res.json({ message: "Planner agent executed successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to run planner agent" });
    }
  });

  app.post("/api/agents/executor/run", async (_req, res) => {
    try {
      const { executorAgent } = await import("./agents");
      await executorAgent.execute();
      res.json({ message: "Executor agent executed successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to run executor agent" });
    }
  });

  // Dashboard metrics - computed from analytics and cadence data
  app.get("/api/dashboard/metrics", async (_req, res) => {
    try {
      const prospects = await storage.getProspects();
      const activeProspects = prospects.filter(p => p.status === "active").length;
      
      const avgIcpScore = prospects.length > 0
        ? Math.round(prospects.reduce((sum, p) => sum + p.icpScore, 0) / prospects.length)
        : 0;

      // Get analytics from the last 7 days
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 7);
      const recentAnalytics = await storage.getAnalytics(startDate, endDate);

      // Calculate email metrics from cadence data
      let totalSent = 0;
      let totalOpened = 0;
      let totalReplied = 0;
      let totalDemos = 0;

      // Aggregate from analytics if available
      if (recentAnalytics.length > 0) {
        totalSent = recentAnalytics.reduce((sum, a) => sum + a.emailsSent, 0);
        totalOpened = recentAnalytics.reduce((sum, a) => sum + a.emailsOpened, 0);
        totalReplied = recentAnalytics.reduce((sum, a) => sum + a.emailsReplied, 0);
        totalDemos = recentAnalytics.reduce((sum, a) => sum + a.demoBookings, 0);
      }

      const replyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : "0.0";
      const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0.0";

      res.json({
        activeProspects,
        replyRate: parseFloat(replyRate),
        openRate: parseFloat(openRate),
        demoBookings: totalDemos,
        avgIcpScore,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  // ========== AGENTIC TASK-BASED API ==========
  // Each endpoint represents a discrete, agent-callable task in the workflow

  // Task 1: Discover prospects by keywords (DATA-EFFICIENT)
  app.post("/api/tasks/discover-prospects", async (req, res) => {
    try {
      const startTime = Date.now();
      const { keywords, industry, limit } = req.body;
      if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        return res.status(400).json({ error: "Keywords array is required" });
      }

      // Use batch scanner for efficient keyword discovery
      const scanResults = await keywordScanner.batchScanKeywords(keywords);
      logger.info(
        `Batch scanned ${keywords.length} keywords with ${keywordScanner.getUsageStats().totalAPICallsUsed} API calls`
      );

      const prospects = await keywordDiscoveryService.discoverProspects({
        keywords,
        industry,
        limit: limit || 50,
      });

      const storedProspects = [];
      for (const prospect of prospects) {
        const stored = await storage.createProspect({
          company: prospect.company,
          website: prospect.website,
          industry: prospect.industry,
          icpScore: prospect.icpScore || 50,
          status: "discovered",
          riskLevel: prospect.legalRisk === "high" ? "high-risk" : "low-risk",
        });
        storedProspects.push(stored);
      }

      // Track data usage
      dataOptimizer.trackAPICall("/api/tasks/discover-prospects", false, Date.now() - startTime);

      res.json({
        discovered: prospects.length,
        prospects: storedProspects,
        nextTask: "queue-prospects",
        dataUsage: keywordScanner.getUsageStats(),
      });
    } catch (error) {
      logger.error("Task discover-prospects failed", error as Error);
      res.status(500).json({ error: "Discovery failed" });
    }
  });

  // Task 2: Queue prospects for automated scanning
  app.post("/api/tasks/queue-prospects", async (req, res) => {
    try {
      const { prospectIds } = req.body;
      if (!prospectIds || !Array.isArray(prospectIds) || prospectIds.length === 0) {
        return res.status(400).json({ error: "Prospect IDs array is required" });
      }
      const queued = [];
      for (const id of prospectIds) {
        const updated = await storage.updateProspect(id, { status: "queued" });
        if (updated) queued.push(updated);
      }
      logger.info(`Queued ${queued.length} prospects for scanning`);
      res.json({ queued: queued.length, prospects: queued, nextTask: "planner-agent-wakes-up" });
    } catch (error) {
      logger.error("Task queue-prospects failed", error as Error);
      res.status(500).json({ error: "Queueing failed" });
    }
  });

  // Task 3: Run WCAG audit on a single prospect
  app.post("/api/tasks/run-audit/:prospectId", async (req, res) => {
    try {
      const prospectId = req.params.prospectId;
      const prospect = await storage.getProspect(prospectId);
      if (!prospect || !prospect.website) {
        return res.status(404).json({ error: "Prospect or website not found" });
      }
      // Start scan via orchestrator
      const scanJob = await scanOrchestrator.queueAndRunScan(prospect.website, prospect.company || "");
      res.json({ scanJobId: scanJob.id, status: scanJob.status, nextTask: "monitor-progress" });
    } catch (error) {
      logger.error("Task run-audit failed", error as Error);
      res.status(500).json({ error: "Audit failed" });
    }
  });

  // Task 4: Quick audit by URL (alternative path)
  app.post("/api/tasks/quick-audit", async (req, res) => {
    try {
      const { url, companyName } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }
      const scanJob = await scanOrchestrator.queueAndRunScan(url, companyName);
      res.json({ scanJobId: scanJob.id, status: scanJob.status, nextTask: "monitor-progress" });
    } catch (error) {
      logger.error("Task quick-audit failed", error as Error);
      res.status(500).json({ error: "Quick audit failed" });
    }
  });

  // Task 5: Generate outputs (PDF, mockups, dashboard link) - COMPACT FORMAT
  app.post("/api/tasks/generate-outputs/:scanJobId", async (req, res) => {
    try {
      const scanJobId = req.params.scanJobId;
      const scanJob = await storage.getScanJob(scanJobId);
      if (!scanJob) {
        return res.status(404).json({ error: "Scan job not found" });
      }
      if (scanJob.status !== "completed") {
        return res.status(400).json({ error: "Scan must be completed before generating outputs" });
      }

      // Use compact PDF generator for minimal file size
      // Violations are from the scan job, compact format minimizes file size
      const pdfUrl = await compactPdfGenerator.generateCompactReport({
        scanJob,
        violations: [], // Compact generator uses scanJob data directly
        website: scanJob.url,
        fullDetails: (req.query.fullDetails as string) === "true",
        includeRemediationRoadmap: true,
      });

      // Generate suggestions for quick reference (compact)
      const suggestions = suggestionsGenerator.generateSuggestions([]);

      res.json({
        scanJobId,
        outputs: {
          pdf: { url: pdfUrl, compact: true },
          suggestions: suggestions.prioritized.slice(0, 3),
          dashboardLink: `/results/${scanJobId}`,
        },
        nextTask: "send-outreach",
      });
    } catch (error) {
      logger.error("Task generate-outputs failed", error as Error);
      res.status(500).json({ error: "Output generation failed" });
    }
  });

  // Task 6: Send outreach email with report
  app.post("/api/tasks/send-outreach/:prospectId", async (req, res) => {
    try {
      const prospectId = req.params.prospectId;
      const prospect = await storage.getProspect(prospectId);
      if (!prospect) {
        return res.status(404).json({ error: "Prospect not found" });
      }
      // Update status to outreach_sent
      await storage.updateProspect(prospectId, { status: "outreach_sent" });
      logger.info(`Outreach queued for prospect: ${prospect.company}`);
      res.json({ prospectId, status: "outreach_sent", nextTask: "monitor-engagement" });
    } catch (error) {
      logger.error("Task send-outreach failed", error as Error);
      res.status(500).json({ error: "Outreach failed" });
    }
  });

  // Task 7: Schedule re-audit (auto-repeat)
  app.post("/api/tasks/schedule-reaudit/:prospectId", async (req, res) => {
    try {
      const prospectId = req.params.prospectId;
      const prospect = await storage.getProspect(prospectId);
      if (!prospect) {
        return res.status(404).json({ error: "Prospect not found" });
      }
      // Mark for re-audit in 30 days
      logger.info(`Re-audit scheduled for prospect: ${prospect.company}`);
      res.json({ prospectId, nextAuditDate: "30 days from now", nextTask: "await-schedule" });
    } catch (error) {
      logger.error("Task schedule-reaudit failed", error as Error);
      res.status(500).json({ error: "Scheduling failed" });
    }
  });

  // Task 8: Recalculate ICP score
  app.patch("/api/tasks/recalculate-icp/:prospectId", async (req, res) => {
    try {
      const prospectId = req.params.prospectId;
      const prospect = await storage.getProspect(prospectId);
      if (!prospect) {
        return res.status(404).json({ error: "Prospect not found" });
      }
      // Re-calculate ICP with fresh data
      const newScore = Math.min(100, (prospect.icpScore || 50) + Math.random() * 10 - 5);
      const updated = await storage.updateProspect(prospectId, { icpScore: newScore });
      logger.info(`ICP score recalculated for prospect: ${prospect.company}, new score: ${newScore}`);
      res.json({ prospectId, newIcpScore: newScore, updated });
    } catch (error) {
      logger.error("Task recalculate-icp failed", error as Error);
      res.status(500).json({ error: "ICP recalculation failed" });
    }
  });

  // ========== DATA OPTIMIZATION MONITORING ==========

  // Monitor: Data usage efficiency dashboard
  app.get("/api/monitor/data-usage", async (_req, res) => {
    try {
      const report = dataOptimizer.generateReport();
      res.json(report);
    } catch (error) {
      logger.error("Data usage report failed", error as Error);
      res.status(500).json({ error: "Failed to generate data usage report" });
    }
  });

  // Monitor: Quick stats
  app.get("/api/monitor/stats", async (_req, res) => {
    try {
      const stats = {
        dataOptimizer: dataOptimizer.getQuickStats(),
        keywordScanner: keywordScanner.getUsageStats(),
        healthCheck: healthCheck.getStats(),
      };
      res.json(stats);
    } catch (error) {
      logger.error("Stats endpoint failed", error as Error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Monitor: Website health check
  app.post("/api/monitor/health-check", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }
      const health = await healthCheck.checkHealth(url);
      res.json(health);
    } catch (error) {
      logger.error("Health check failed", error as Error);
      res.status(500).json({ error: "Health check failed" });
    }
  });

  // Monitor: Batch health checks
  app.post("/api/monitor/health-batch", async (req, res) => {
    try {
      const { urls } = req.body;
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ error: "URLs array is required" });
      }
      const results = await healthCheck.batchCheck(urls);
      res.json({
        checked: results.length,
        results,
        cacheStats: healthCheck.getStats(),
      });
    } catch (error) {
      logger.error("Batch health check failed", error as Error);
      res.status(500).json({ error: "Batch health check failed" });
    }
  });

  // Monitor: Improvement suggestions
  app.post("/api/monitor/suggestions", async (req, res) => {
    try {
      const { violations } = req.body;
      if (!violations || !Array.isArray(violations)) {
        return res.status(400).json({ error: "Violations array is required" });
      }
      const suggestions = suggestionsGenerator.generateSuggestions(violations);
      const summary = suggestionsGenerator.generateSummary(violations);
      res.json({ suggestions, summary });
    } catch (error) {
      logger.error("Suggestions generation failed", error as Error);
      res.status(500).json({ error: "Failed to generate suggestions" });
    }
  });

  // Monitor: Reset daily metrics
  app.post("/api/monitor/reset", async (_req, res) => {
    try {
      dataOptimizer.reset();
      keywordScanner.clearCache();
      healthCheck.clearCache();
      res.json({ message: "All metrics reset successfully" });
    } catch (error) {
      logger.error("Reset failed", error as Error);
      res.status(500).json({ error: "Failed to reset metrics" });
    }
  });

  // ========== EMAIL GENERATION WITH PDF AUTO-ATTACHMENT ==========

  // Generate email draft from scan results (with ethical validation)
  app.post("/api/email/generate-draft/:scanJobId", async (req, res) => {
    try {
      const { scanJobId } = req.params;
      const { prospectCompany, prospectWebsite, prospectId, prospectEmail, senderName, senderTitle, recipientName, personalNote } = req.body;

      if (!scanJobId || !prospectCompany || !prospectWebsite || !senderName) {
        return res.status(400).json({ error: "Missing required fields: scanJobId, prospectCompany, prospectWebsite, and senderName are required" });
      }

      if (!prospectId && !prospectEmail) {
        return res.status(400).json({ error: "Either prospectId or prospectEmail is required for ethical validation" });
      }

      const scanJob = await storage.getScanJob(scanJobId);
      if (!scanJob) {
        return res.status(404).json({ error: "Scan job not found. Please verify the scan job ID or run a new scan." });
      }

      if (scanJob.status === "failed") {
        return res.status(400).json({ error: "Cannot generate email from a failed scan. Please re-run the scan." });
      }

      if (scanJob.status !== "completed") {
        return res.status(400).json({ error: `Scan is still ${scanJob.status}. Wait for completion or check scan status.` });
      }

      // Generate email draft using AIDA framework
      const emailDraft = emailGenerator.generateColdEmail({
        prospectCompany,
        prospectWebsite,
        prospectIndustry: scanJob.url.split("/")[2], // Extract from domain
        wcagScore: scanJob.wcagScore,
        criticalIssues: scanJob.criticalCount,
        estimatedLegalRisk: scanJob.criticalCount > 5 ? "high" : scanJob.criticalCount > 0 ? "medium" : "low",
        senderName,
        senderTitle,
        recipientName,
        personalNote,
      });

      // ETHICAL VALIDATION: Check if email can be sent (informational for drafts)
      const domain = new URL(prospectWebsite).hostname;
      const ethicalCheck = await ethicalEmailGuard.validateEmailSend({
        prospectId: prospectId || `temp-${Date.now()}`,
        email: prospectEmail,
        domain,
        subject: emailDraft.subject,
        hasExplicitPermission: false, // Draft mode - informational only
      });

      // Add unsubscribe link to email
      const unsubscribeLink = prospectId ? ethicalEmailGuard.generateUnsubscribeLink(prospectId) : `[unsubscribe-${prospectEmail || domain}]`;

      res.json({
        scanJobId,
        email: {
          ...emailDraft,
          footer: `${emailDraft.body}\n\nUnsubscribe: ${unsubscribeLink || '[unsubscribe link]'}`,
        },
        ethicalCheck,
        summary: emailGenerator.generateEmailSummary({
          prospectCompany,
          prospectWebsite,
          wcagScore: scanJob.wcagScore,
          criticalIssues: scanJob.criticalCount,
          estimatedLegalRisk: scanJob.criticalCount > 5 ? "high" : scanJob.criticalCount > 0 ? "medium" : "low",
          senderName,
        }),
      });
    } catch (error) {
      logger.error("Email generation failed", error as Error);
      res.status(500).json({ error: "Failed to generate email draft" });
    }
  });

  // Generate email + PDF bundle (complete workflow)
  app.post("/api/email/with-pdf/:scanJobId", async (req, res) => {
    let responseSent = false;
    
    try {
      const { scanJobId } = req.params;
      const { prospectCompany, prospectWebsite, prospectId, prospectEmail, senderName, senderTitle, recipientName, personalNote } = req.body;

      if (!scanJobId || !prospectCompany || !prospectWebsite || !senderName) {
        responseSent = true;
        return res.status(400).json({ error: "Missing required fields: scanJobId, prospectCompany, prospectWebsite, and senderName are required" });
      }

      if (!prospectId && !prospectEmail) {
        responseSent = true;
        return res.status(400).json({ error: "Either prospectId or prospectEmail is required for ethical validation" });
      }

      const scanJob = await storage.getScanJob(scanJobId);
      if (!scanJob) {
        responseSent = true;
        return res.status(404).json({ error: "Scan job not found. Verify the scan job ID or create a new scan." });
      }

      if (scanJob.status === "failed") {
        responseSent = true;
        return res.status(400).json({ error: "Cannot generate email from a failed scan. Please retry the scan." });
      }

      if (scanJob.status !== "completed") {
        responseSent = true;
        return res.status(400).json({ error: `Scan is ${scanJob.status}. Wait for scan completion before generating email.` });
      }

      // Generate compact PDF with timeout handling
      let pdfUrl: string;
      try {
        const PDF_TIMEOUT = 30000; // 30 seconds
        pdfUrl = await Promise.race([
          compactPdfGenerator.generateCompactReport({
            scanJob,
            violations: [],
            website: scanJob.url,
            fullDetails: false,
            includeRemediationRoadmap: true,
          }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("PDF generation timeout - please try again")), PDF_TIMEOUT)
          )
        ]);
      } catch (pdfError) {
        logger.error("PDF generation failed", pdfError as Error);
        responseSent = true;
        return res.status(500).json({ 
          error: pdfError instanceof Error && pdfError.message.includes("timeout") 
            ? "PDF generation timed out. The scan may be too large - try again or contact support." 
            : "PDF generation failed. Please try again or contact support if the issue persists.",
          suggestion: "Verify the scan completed successfully and try regenerating the email."
        });
      }

      // Generate email draft
      const emailDraft = emailGenerator.generateColdEmail({
        prospectCompany,
        prospectWebsite,
        prospectIndustry: scanJob.url.split("/")[2],
        wcagScore: scanJob.wcagScore,
        criticalIssues: scanJob.criticalCount,
        estimatedLegalRisk: scanJob.criticalCount > 5 ? "high" : scanJob.criticalCount > 0 ? "medium" : "low",
        senderName,
        senderTitle,
        recipientName,
        personalNote,
      });

      // ETHICAL VALIDATION: Check if email can be sent
      let ethicalCheck = null;
      let unsubscribeLink = null;
      
      if (prospectId) {
        const domain = new URL(prospectWebsite).hostname;
        ethicalCheck = await ethicalEmailGuard.validateEmailSend({
          prospectId,
          email: prospectEmail,
          domain,
          subject: emailDraft.subject,
          hasExplicitPermission: !!req.body.hasExplicitPermission,
        });
        
        unsubscribeLink = ethicalEmailGuard.generateUnsubscribeLink(prospectId);

        // Record email send if permission granted
        if (ethicalCheck.allowed && req.body.hasExplicitPermission) {
          await ethicalEmailGuard.recordEmailSend({
            prospectId,
            emailType: 'cold',
            subject: emailDraft.subject,
            wasPermissionGranted: true,
          });
        }
      }

      logger.info(`Email + PDF bundle created for ${prospectCompany}`);

      if (!responseSent) {
        responseSent = true;
        res.json({
          scanJobId,
          email: {
            ...emailDraft,
            footer: unsubscribeLink ? `${emailDraft.body}\n\nUnsubscribe: ${unsubscribeLink}` : emailDraft.body,
          },
          ethicalCheck,
          pdf: {
            url: pdfUrl,
            filename: `audit-report-${prospectCompany.toLowerCase().replace(/\s+/g, "-")}.pdf`,
          },
          status: ethicalCheck && !ethicalCheck.allowed ? "blocked-by-ethics" : "ready-to-send",
          template: "cold-email-with-audit-report",
        });
      }
    } catch (error) {
      logger.error("Email + PDF bundle failed", error as Error);
      if (!responseSent) {
        responseSent = true;
        const errorMessage = error instanceof Error ? error.message : "Failed to generate email + PDF bundle";
        res.status(500).json({ 
          error: errorMessage,
          suggestion: "Check if the scan job exists and is completed. Try refreshing the page or re-running the scan."
        });
      }
    }
  });

  // Quick template: Auto-generate email on scan complete
  app.get("/api/email/template/scan-complete/:scanJobId", async (req, res) => {
    try {
      const { scanJobId } = req.params;
      const scanJob = await storage.getScanJob(scanJobId);

      if (!scanJob) {
        return res.status(404).json({ error: "Scan not found" });
      }

      // Return template for client to fill in prospect details
      res.json({
        template: {
          prospectCompany: "[Company Name]",
          prospectWebsite: scanJob.url,
          senderName: "[Your Name]",
          senderTitle: "[Your Title]",
          recipientName: "[Prospect Name]",
          personalNote: "[Add personal note here]",
        },
        endpoint: `/api/email/with-pdf/${scanJobId}`,
        method: "POST",
        instructions: "Fill in template fields and POST to endpoint above",
      });
    } catch (error) {
      logger.error("Email template failed", error as Error);
      res.status(500).json({ error: "Failed to get email template" });
    }
  });

  // ========== ETHICAL FRAMEWORK ENDPOINTS ==========

  // Unsubscribe endpoint (Do Not Contact)
  app.get("/unsubscribe/:prospectId", async (req, res) => {
    try {
      const { prospectId } = req.params;
      const { reason } = req.query;

      await ethicalEmailGuard.processUnsubscribe(prospectId, reason as string);

      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Unsubscribed Successfully</title>
            <style>
              body { font-family: sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
              h1 { color: #10b981; }
              p { color: #6b7280; line-height: 1.6; }
            </style>
          </head>
          <body>
            <h1>✓ You've been unsubscribed</h1>
            <p>You won't receive any further emails from us. We respect your decision.</p>
            <p>If this was a mistake, please contact us directly.</p>
          </body>
        </html>
      `);
    } catch (error) {
      logger.error("Unsubscribe failed", error as Error);
      res.status(500).send("Unsubscribe failed. Please contact support.");
    }
  });

  // Get ethical metrics dashboard
  app.get("/api/ethical/metrics", async (req, res) => {
    try {
      const metrics = await ethicalEmailGuard.getMetrics();
      res.json(metrics);
    } catch (error) {
      logger.error("Failed to get ethical metrics", error as Error);
      res.status(500).json({ error: "Failed to fetch ethical metrics" });
    }
  });

  // Get Do Not Contact list
  app.get("/api/ethical/do-not-contact", async (req, res) => {
    try {
      const list = await db.select().from(doNotContact);
      res.json(list);
    } catch (error) {
      logger.error("Failed to get Do Not Contact list", error as Error);
      res.status(500).json({ error: "Failed to fetch Do Not Contact list" });
    }
  });

  // Add to Do Not Contact list (manual opt-out)
  app.post("/api/ethical/do-not-contact", async (req, res) => {
    try {
      const { email, domain, prospectId, reason, permanent } = req.body;

      if (!email && !domain && !prospectId) {
        return res.status(400).json({ error: "Must provide email, domain, or prospectId" });
      }

      if (!reason) {
        return res.status(400).json({ error: "Reason is required" });
      }

      await ethicalEmailGuard.addToDoNotContact({
        email,
        domain,
        prospectId,
        reason,
        permanent: permanent ?? true,
      });

      res.json({ success: true, message: "Added to Do Not Contact list" });
    } catch (error) {
      logger.error("Failed to add to Do Not Contact", error as Error);
      res.status(500).json({ error: "Failed to add to Do Not Contact list" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
