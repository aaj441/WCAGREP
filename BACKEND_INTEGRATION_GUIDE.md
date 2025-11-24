# 🌐 Multi-Browser Backend Integration Guide

## Overview

The WCAG AI Platform supports **4 browser automation backends** with intelligent selection, automatic fallback, and real-time monitoring:

1. **Puppeteer (Local)** - Always available, runs on your server
2. **Opera Neon** - Cloud WebSocket-based browser automation
3. **Comet** - REST API browser automation service
4. **BrowserOS** - Distributed cloud browser grid

## Architecture

### Backend Selection Strategies

The system uses a **Backend Manager** that can select backends using three strategies:

#### 1. Least-Loaded (Default)
Selects the backend with the fewest active scans. Best for balanced load distribution.

#### 2. Round-Robin
Rotates through available backends sequentially. Best for equal distribution across all providers.

#### 3. Priority
Tries backends in order: Comet → BrowserOS → Neon → Puppeteer. Best when you have preferred premium providers.

### Automatic Fallback

If a cloud backend fails or is unavailable:
1. System tries the selected backend first
2. Logs warning if it fails
3. Automatically falls back to local Puppeteer
4. Scan continues without interruption

## Configuration

### Environment Variables

#### Puppeteer (Local)
No configuration needed - always available if Chrome dependencies are installed.

#### Opera Neon
```bash
export NEON_WS_URL="wss://neon.opera.com/browser"
export NEON_API_TOKEN="your-neon-api-token"
export NEON_PAID="true"  # Optional: enables unlimited scans
```

Free tier: 3 scans/day
Paid tier: Unlimited

#### Comet
```bash
export COMET_API_URL="https://api.comet.com"
export COMET_API_KEY="your-comet-api-key"
export COMET_PAID="true"  # Optional: enables unlimited scans
```

Free tier: 10 scans/day
Paid tier: Unlimited

#### BrowserOS
```bash
export BROWSEROS_API_URL="https://api.browseros.com"
export BROWSEROS_API_KEY="your-browseros-api-key"
export BROWSEROS_PAID="true"  # Optional: enables unlimited scans
```

Free tier: 5 scans/day
Paid tier: Unlimited

### System Dependencies (Puppeteer)

Puppeteer requires Chrome and its dependencies. On Replit, these are installed:

```bash
# Already installed via packager_tool
glib, nss, nspr, atk, mesa, cups, libdrm, xorg.libxcb, xorg.libX11,
xorg.libXcomposite, xorg.libXdamage, xorg.libXext, xorg.libXfixes,
xorg.libXrandr, xorg.libxshmfence, pango, cairo, alsa-lib, dbus,
at-spi2-atk, expat
```

## Usage

### Automatic (Recommended)

The system automatically selects the best available backend:

```typescript
// Agents use auto-selection
await wcagScanner.scanWebsite(url);
```

The manager will:
- Check which backends are available
- Apply selection strategy (least-loaded by default)
- Handle concurrency and daily limits
- Fallback if selected backend fails

### Manual Backend Selection

Force a specific backend:

```typescript
import { wcagScanner } from "./services/wcag-scanner";

// Prefer Opera Neon
await wcagScanner.scanWebsite(url, "neon");

// Prefer Comet
await wcagScanner.scanWebsite(url, "comet");

// Force local Puppeteer
await wcagScanner.scanWebsite(url, "puppeteer");
```

### Checking Backend Status

```typescript
import { browserBackendManager } from "./services/browser-backends";

// Get all backend stats
const stats = browserBackendManager.getAllStats();

// Check which backends are available
const available = browserBackendManager.getAvailableBackends();
console.log(`Available: ${available.join(", ")}`);

// Select a backend programmatically
const backend = browserBackendManager.selectBackend();
if (backend) {
  console.log(`Selected: ${backend.getName()}`);
}
```

## Monitoring

### Backend Status Dashboard

Visit `/backends` to see:
- Total backends and how many are enabled
- Active scans and daily usage per backend
- Real-time progress bars for concurrency and quotas
- Setup instructions for each provider

### API Endpoint

```bash
GET /api/backends/stats

# Returns:
[
  {
    "name": "Puppeteer (Local)",
    "enabled": true,
    "activeScans": 1,
    "dailyScans": 5,
    "dailyLimit": null,
    "concurrent": 2
  },
  {
    "name": "Opera Neon",
    "enabled": true,
    "activeScans": 0,
    "dailyScans": 2,
    "dailyLimit": 3,
    "concurrent": 2
  },
  ...
]
```

## Resource Management

### Concurrency Limits

Each backend has a maximum number of simultaneous scans:

- **Puppeteer:** 2 concurrent scans
- **Opera Neon:** 2 concurrent scans
- **Comet:** 5 concurrent scans
- **BrowserOS:** 3 concurrent scans

### Daily Quotas

Free tier limits reset at midnight:

- **Puppeteer:** Unlimited (runs locally)
- **Opera Neon:** 3 scans/day (free), unlimited (paid)
- **Comet:** 10 scans/day (free), unlimited (paid)
- **BrowserOS:** 5 scans/day (free), unlimited (paid)

### Backend Selection Logic

```typescript
// Backend is available if:
1. Enabled (has valid configuration)
2. Below concurrent limit (activeScans < concurrent)
3. Below daily quota (dailyScans < dailyLimit OR no limit)

// If unavailable, system tries next backend in strategy order
```

## Error Handling

### Initialization Failures

If a backend fails to initialize:
1. Error is logged with clear message
2. Backend is marked as disabled
3. System continues with remaining backends
4. No hard failure - other backends still work

Example log:
```
❌ puppeteer: Initialization failed, disabling - Chrome dependencies missing
⚠️  Comet: Skipped (set COMET_API_URL and COMET_API_KEY to enable)
✅ Opera Neon: Available (2 concurrent, 3 daily)
```

### Scan Failures

If a scan fails on a cloud backend:
1. Error is logged with backend name
2. System falls back to local Puppeteer
3. Scan continues automatically
4. Job status is updated with fallback info

Example:
```
Using Comet for scan: https://example.com
❌ Comet scan failed, falling back to local Puppeteer
✅ Using local Puppeteer for scan: https://example.com
```

### Quota Exhaustion

When a backend hits its daily limit:
1. Backend.isAvailable() returns false
2. Manager selects next available backend
3. Scans continue on other providers
4. Counter resets at midnight automatically

## Integration with Agents

### Executor Agent

The Executor Agent automatically uses the backend manager:

```typescript
// In executor-agent.ts
const scanResult = await wcagScanner.scanWebsite(job.url);
// ^ Automatically selects best backend
```

### Backend Tracking

Scan jobs track which backend was used:

```typescript
await storage.updateScanJob(jobId, {
  metadata: { backendUsed: "auto-selected" }
});
```

## Troubleshooting

### No Backends Available

**Problem:** All backends show as disabled

**Solution:**
1. Check Puppeteer dependencies are installed
2. Configure at least one cloud backend
3. Check logs for specific initialization errors

### Scans Always Use Puppeteer

**Problem:** Cloud backends configured but never used

**Solution:**
1. Check `/backends` to verify backends are enabled
2. Verify API credentials are correct
3. Check backend daily limits aren't exhausted
4. Review logs for selection decisions

### High Failure Rate

**Problem:** Many scans failing

**Solution:**
1. Check `/agents` Monitor Agent for failure patterns
2. Review specific backend error messages
3. Verify target websites are accessible
4. Check if backends are rate-limiting requests

## Best Practices

### 1. Use Multiple Backends

Configure at least 2 backends for redundancy:
- Local Puppeteer as fallback
- One cloud provider as primary

### 2. Monitor Daily Quotas

Check `/backends` dashboard to track usage:
- Yellow warning at 70% quota
- Red alert at 90% quota

### 3. Scale Appropriately

Adjust agent intervals based on backend availability:
```typescript
// If using free tiers (18 scans/day total)
plannerIntervalMinutes: 120  // Run less frequently

// If using paid tiers (unlimited)
plannerIntervalMinutes: 30   // Run more aggressively
```

### 4. Handle Errors Gracefully

Always check backend availability before critical operations:
```typescript
const available = browserBackendManager.getAvailableBackends();
if (available.length === 0) {
  console.warn("No backends available - scans will be queued");
}
```

### 5. Use Priority Strategy for Production

In production with paid backends:
```typescript
const manager = new BrowserBackendManager("priority");
// Prefers premium backends (Comet, BrowserOS) over local
```

## Advanced Configuration

### Custom Backend Selection

Create your own selection logic:

```typescript
import { browserBackendManager } from "./services/browser-backends";

function selectBackendForProspect(prospect: Prospect) {
  // High-value prospects get premium backends
  if (prospect.icpScore > 80) {
    return browserBackendManager.getBackend("comet");
  }
  
  // Standard prospects use auto-selection
  return browserBackendManager.selectBackend();
}
```

### Backend-Specific Configuration

Customize limits per backend:

```typescript
const puppeteer = new PuppeteerBackend({
  name: "Puppeteer (Local)",
  enabled: true,
  concurrent: 4,  // Increase for powerful server
});

const neon = new NeonBackend();
neon.config.concurrent = 5;  // Override default
```

## Summary

The multi-browser backend system provides:

✅ **Reliability** - Automatic fallback ensures scans always complete
✅ **Scalability** - Distribute load across multiple providers
✅ **Cost Optimization** - Use free tiers then upgrade as needed
✅ **Flexibility** - Switch providers without code changes
✅ **Monitoring** - Real-time visibility into backend status

Configure your preferred backends and let the system handle the rest!
