import postgres from "postgres";

// Get database URL from environment or use default for Replit
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/wcagrep";

// Create PostgreSQL connection
export const sql = postgres(databaseUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Export a mock db object for compatibility
export const db = {
  select: () => ({
    from: (table: any) => sql`SELECT * FROM ${sql(table)}`,
  }),
  insert: (table: any) => ({
    values: (data: any) => sql`INSERT INTO ${sql(table)} ${sql(data)}`,
  }),
  update: (table: any) => ({
    set: (data: any) => ({
      where: (condition: any) => sql`UPDATE ${sql(table)} SET ${sql(data)} WHERE ${condition}`,
    }),
  }),
  delete: (table: any) => ({
    where: (condition: any) => sql`DELETE FROM ${sql(table)} WHERE ${condition}`,
  }),
};

// Initialize database tables
export async function initDatabase() {
  try {
    // Create prospects table
    await sql`
      CREATE TABLE IF NOT EXISTS prospects (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        company TEXT NOT NULL,
        website TEXT NOT NULL,
        industry TEXT,
        icp_score INTEGER DEFAULT 50,
        status TEXT DEFAULT 'discovered',
        risk_level TEXT DEFAULT 'medium-risk',
        email TEXT,
        contact_name TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create scan_jobs table
    await sql`
      CREATE TABLE IF NOT EXISTS scan_jobs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        url TEXT NOT NULL,
        prospect_id TEXT REFERENCES prospects(id),
        status TEXT DEFAULT 'pending',
        wcag_score INTEGER,
        critical_count INTEGER DEFAULT 0,
        serious_count INTEGER DEFAULT 0,
        moderate_count INTEGER DEFAULT 0,
        minor_count INTEGER DEFAULT 0,
        original_html TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create violations table
    await sql`
      CREATE TABLE IF NOT EXISTS violations (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        prospect_id TEXT REFERENCES prospects(id),
        scan_job_id TEXT REFERENCES scan_jobs(id),
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        element TEXT,
        recommendation TEXT,
        wcag_criterion TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create triggers table
    await sql`
      CREATE TABLE IF NOT EXISTS triggers (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        condition TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        config JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create clients table
    await sql`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        company TEXT,
        api_key TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create do_not_contact table
    await sql`
      CREATE TABLE IF NOT EXISTS do_not_contact (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email TEXT,
        domain TEXT,
        prospect_id TEXT,
        reason TEXT NOT NULL,
        permanent BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log("✓ Database tables initialized");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}
