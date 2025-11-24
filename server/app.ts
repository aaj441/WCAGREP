import express, { type Express } from "express";
import { type Server } from "http";
import { registerRoutes } from "./routes";
import { initDatabase } from "./db";
import { validateStartup } from "./startup";
import { logger } from "./logger";

export default async function runApp(
  setupVite: (app: Express, server: Server) => Promise<void>
) {
  const app = express();

  // Parse JSON bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Validate environment
  try {
    validateStartup();
  } catch (error) {
    logger.warn("Startup validation warnings", error);
  }

  // Initialize database
  try {
    await initDatabase();
    logger.info("Database initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize database", error as Error);
  }

  // Register API routes
  const httpServer = await registerRoutes(app);

  // Setup Vite dev server (for HMR)
  await setupVite(app, httpServer);

  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
  });

  return httpServer;
}
