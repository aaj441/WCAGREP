import { storage } from "./db-storage";
import { logger } from "./logger";

export async function seedData() {
  try {
    // Check if data already exists
    const existingProspects = await storage.getProspects();
    if (existingProspects.length > 0) {
      logger.info("Database already seeded, skipping");
      return;
    }

    logger.info("Seeding database with sample data...");

    // Create sample prospects
    await storage.createProspect({
      company: "TechCorp Inc",
      website: "https://example.com",
      industry: "Technology",
      icpScore: 75,
      status: "discovered",
      riskLevel: "medium-risk",
    });

    await storage.createProspect({
      company: "HealthCare Solutions",
      website: "https://healthcare-example.com",
      industry: "Healthcare",
      icpScore: 85,
      status: "queued",
      riskLevel: "high-risk",
    });

    logger.info("✓ Database seeded successfully");
  } catch (error) {
    logger.error("Failed to seed database", error as Error);
  }
}
