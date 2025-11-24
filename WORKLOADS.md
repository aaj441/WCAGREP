# WCAG AI Platform - Workload Configuration

Your developed workloads are now configured and ready to run! Use the workload launcher to easily switch between different operational modes.

## Quick Start

### Option 1: Interactive Launcher (Recommended)
```bash
./run-workload.sh
```
This opens an interactive menu where you can select which workload to run.

### Option 2: Direct Commands
```bash
# Start web server only
./run-workload.sh web

# Start agents only
./run-workload.sh agents

# Run both together (Full Stack)
./run-workload.sh full-stack

# Run monitor agent only
./run-workload.sh monitor

# Run keyword discovery service
./run-workload.sh keyword

# Run WCAG scanner service
./run-workload.sh scanner

# Build and run production mode
./run-workload.sh prod
```

## Workload Descriptions

### 1. Web Server
- **Purpose**: Run the main web application
- **Port**: 5000
- **Includes**: 
  - React frontend (quick-win flow, keyword discovery, reports, email outreach)
  - Express.js backend with REST API
  - Real-time UI updates via TanStack Query
- **Use When**: Testing the user interface, manually running scans, configuring settings

### 2. Agentic Automation System
- **Purpose**: Run autonomous agents for full-stack workflow automation
- **Agents**:
  - **Planner Agent**: Discovers and schedules prospects for audits
  - **Executor Agent**: Processes scan jobs, runs WCAG audits, generates PDF reports
  - **Outreach Agent**: Sends audit reports via email, tracks engagement
  - **Monitor Agent**: Tracks system health, agent status, manages job retries
- **Features**:
  - Automatic prospect discovery via keywords
  - Batch WCAG scanning with violations detection
  - PDF report generation with risk scoring
  - Email outreach with Masonic compliance (max 1 email/week, DNC list)
  - Real-time monitoring dashboard
- **Use When**: Running automated audits, processing prospect queues, testing agent orchestration

### 3. Full Stack
- **Purpose**: Run web server AND agents simultaneously
- **Features**:
  - Both web interface and automation agents active
  - Can manually trigger scans and also have agents running
  - Real-time monitoring of agent status from the dashboard
- **Use When**: Testing complete end-to-end workflows, demo scenarios, development with full visibility

### 4. Monitor Agent
- **Purpose**: System health monitoring and agent status tracking
- **Tracks**:
  - Agent health checks (uptime, error rates)
  - Job queue status and retry management
  - Scanning performance metrics
  - Email compliance tracking (weekly limits, DNC violations)
  - Compliance dashboard data
- **Use When**: Debugging agent issues, checking system health, monitoring compliance metrics

### 5. Keyword Discovery Service
- **Purpose**: Autonomous prospect identification
- **Features**:
  - Google Custom Search API integration
  - Batch keyword lookups with 24-hour caching
  - ICP (Ideal Client Profile) scoring
  - Industry-specific prospect categorization
  - Cost optimization (60% fewer API calls via caching)
- **Use When**: Discovering new prospects, testing keyword search, building prospect pipelines

### 6. WCAG Scanner Service
- **Purpose**: Accessibility auditing engine
- **Features**:
  - Puppeteer-based website scanning
  - Axe-core accessibility testing (WCAG 2.1 standard)
  - Critical-only violation detection for speed
  - Screenshot capture of violations
  - Before/after composite generation
  - Legal risk assessment
  - 15-30 second scan time (quick-scan mode)
- **Use When**: Running manual audits, testing scanning performance, debugging violations

### 7. Production Mode
- **Purpose**: Build and run production-optimized server
- **Features**:
  - Minified JavaScript bundle (220KB)
  - Agents automatically enabled
  - Optimized for deployment
  - Full production logging
- **Use When**: Preparing for deployment, final testing before publishing, performance testing

## Environment Variables

### Development
```bash
NODE_ENV=development        # Development mode (unminified, verbose logging)
ENABLE_AGENTS=true         # Enable agentic automation
GOOGLE_SEARCH_API_KEY      # Google Custom Search API key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID  # Google CSE ID
```

### Production
```bash
NODE_ENV=production        # Production mode (minified, optimized)
ENABLE_AGENTS=true         # Agents always enabled in production
DATABASE_URL               # PostgreSQL connection string
SESSION_SECRET             # Session encryption key
```

## Keyboard Shortcuts

When running the web server, use these global shortcuts for rapid testing:

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl+D | Go to Discovery (keyword lookup) |
| Cmd/Ctrl+S | Go to Scanner (URL audit) |
| Cmd/Ctrl+R | Go to Reports (view results) |
| Cmd/Ctrl+E | Go to Email Outreach |
| Cmd/Ctrl+T | Go to Dashboard |
| Cmd/Ctrl+K | Open Command Palette |
| Cmd/Ctrl+Shift+A | Trigger Agent Mode (full automation) |

## Performance Targets

- **Keyword Discovery**: 1 API call per 3 keywords (batch processing)
- **WCAG Scanning**: 15-30 seconds per site (quick-scan mode)
- **PDF Generation**: <500KB per report (compact format)
- **Memory Usage**: <250MB for health checks (lightweight)
- **Cost Efficiency**: 95% reduction through data optimization

## API Endpoints (When Server Running)

### Task-Based Endpoints (Agent-Ready)
```
POST /api/tasks/discover-prospects      # Find companies by keywords
POST /api/tasks/queue-prospects         # Queue discovered prospects
POST /api/tasks/run-audit/:prospectId   # Run WCAG audit
POST /api/tasks/generate-outputs/:scanJobId  # Generate PDF & mockups
POST /api/tasks/send-outreach/:prospectId   # Send outreach email
GET  /api/agents/status                 # Get real-time agent status
```

### Monitoring Endpoints
```
GET  /api/monitor/data-usage            # Efficiency dashboard
GET  /api/monitor/stats                 # Quick stats (cache hits, API calls)
POST /api/monitor/health-check          # Check single URL (cached 6 hours)
POST /api/monitor/health-batch          # Batch check 10+ URLs
POST /api/monitor/suggestions           # Generate improvement suggestions
POST /api/monitor/reset                 # Reset daily metrics
```

## Troubleshooting

### Browser Issues
If you see errors about Chrome/Chromium not found:
- This is expected in the Replit environment
- The system falls back to cloud-based browser backends
- Scanning still works via Opera Neon, Comet, or BrowserOS

### Agent Not Starting
1. Check `ENABLE_AGENTS=true` is set
2. Verify server is listening on port 5000
3. Check logs for initialization errors
4. Use Monitor Agent to diagnose issues

### Database Connection Error
1. Ensure PostgreSQL database is created
2. Check DATABASE_URL environment variable
3. Run `npm run db:push` to initialize schema

## Development Workflow

**2-Minute Testing Cycle** (Consultant-Focused):
1. Run `./run-workload.sh full-stack` to start everything
2. Use keyboard shortcuts to navigate (Cmd/Ctrl+Shift+A for Agent Mode)
3. Trigger an agent workflow
4. Monitor progress in the Dashboard
5. Review generated reports and compliance data

## Next Steps

1. **Test Keyword Discovery**: Use `./run-workload.sh keyword` and search for prospects in your industry
2. **Run Full Stack**: Use `./run-workload.sh full-stack` for end-to-end testing
3. **Monitor Compliance**: Use `./run-workload.sh monitor` to track email/WCAG compliance
4. **Deploy to Production**: Use `./run-workload.sh prod` when ready for deployment

---

For more information, see:
- `replit.md` - Project architecture and integration details
- `DATA_EFFICIENCY_GUIDE.md` - Cost optimization strategies
- GitHub: aaj441/WCAGREP (once published)
