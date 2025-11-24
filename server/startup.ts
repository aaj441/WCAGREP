/**
 * Server startup validation
 * Ensures required environment variables and dependencies are configured
 */

export function validateStartup(): void {
  const required = [
    'DATABASE_URL',
    'SESSION_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    const list = missing.join(', ');
    throw new Error(
      `Missing required environment variables: ${list}\n` +
      `Please configure these before starting the application.`
    );
  }

  // Additional validations
  if (!process.env.DATABASE_URL?.includes('postgresql')) {
    console.warn('⚠️  DATABASE_URL does not appear to be a PostgreSQL connection string');
  }

  console.log('✓ Startup validation passed');
}
