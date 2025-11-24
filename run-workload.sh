#!/bin/bash

# WCAG AI Platform - Workload Launcher
# Run different workloads: Web Server, Agents, Full Stack

set -e

PORT=5000
NODE_ENV=development

print_menu() {
  echo ""
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║  WCAG AI Platform - Workload Launcher                      ║"
  echo "╠════════════════════════════════════════════════════════════╣"
  echo "║  1) Start Web Server (Port 5000)                           ║"
  echo "║  2) Start Agents (Planner, Executor, Outreach, Monitor)    ║"
  echo "║  3) Full Stack (Web Server + Agents)                       ║"
  echo "║  4) Monitor Agent Only                                     ║"
  echo "║  5) Keyword Discovery Service                              ║"
  echo "║  6) WCAG Scanner Service                                   ║"
  echo "║  7) Production Mode                                        ║"
  echo "║  8) Exit                                                   ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo ""
}

run_web_server() {
  echo "🌐 Starting Web Server on port $PORT..."
  echo "Frontend: http://localhost:$PORT"
  echo "Press Ctrl+C to stop"
  echo ""
  exec npm run dev
}

run_agents() {
  echo "🤖 Starting Agentic Automation System..."
  echo "Enabled Agents:"
  echo "  • Planner Agent - selects & schedules prospects"
  echo "  • Executor Agent - processes scan jobs & generates reports"
  echo "  • Outreach Agent - sends audit reports & tracks engagement"
  echo "  • Monitor Agent - tracks system health & job retries"
  echo ""
  echo "Press Ctrl+C to stop"
  echo ""
  exec env ENABLE_AGENTS=true NODE_ENV=$NODE_ENV tsx server/index-dev.ts
}

run_full_stack() {
  echo "⚡ Starting Full Stack (Web Server + Agents)..."
  echo "Web Server: http://localhost:$PORT"
  echo "Agents: Running in background"
  echo ""
  
  # Start web server in background
  npm run dev &
  WEB_PID=$!
  
  # Wait for server to start
  sleep 3
  
  # Start agents
  echo ""
  echo "🤖 Agents starting..."
  env ENABLE_AGENTS=true NODE_ENV=$NODE_ENV tsx server/index-dev.ts &
  AGENTS_PID=$!
  
  echo ""
  echo "✅ Full Stack Running:"
  echo "  • Web Server (PID: $WEB_PID)"
  echo "  • Agents (PID: $AGENTS_PID)"
  echo ""
  echo "Press Ctrl+C to stop both services"
  echo ""
  
  # Wait for both processes
  wait $WEB_PID $AGENTS_PID
}

run_monitor_only() {
  echo "📊 Starting Monitor Agent Only..."
  echo "Monitoring system health, agent status, and job retries"
  echo "Web Server: http://localhost:$PORT"
  echo ""
  echo "Press Ctrl+C to stop"
  echo ""
  exec env ENABLE_AGENTS=true NODE_ENV=$NODE_ENV tsx server/index-dev.ts --monitor-only
}

run_keyword_discovery() {
  echo "🔍 Starting Keyword Discovery Service..."
  echo "Service: Prospect identification via Google Custom Search"
  echo "Web Server: http://localhost:$PORT"
  echo ""
  echo "Press Ctrl+C to stop"
  echo ""
  exec npm run dev
}

run_wcag_scanner() {
  echo "♿ Starting WCAG Scanner Service..."
  echo "Service: Accessibility auditing with Puppeteer & Axe-core"
  echo "Web Server: http://localhost:$PORT"
  echo ""
  echo "Press Ctrl+C to stop"
  echo ""
  exec npm run dev
}

run_production() {
  echo "🚀 Building and starting Production Server..."
  npm run build
  
  echo ""
  echo "📦 Production Server: http://localhost:$PORT"
  echo "Agents: Automatically enabled in production"
  echo ""
  echo "Press Ctrl+C to stop"
  echo ""
  exec env NODE_ENV=production node dist/index.js
}

main() {
  while true; do
    print_menu
    read -p "Select workload (1-8): " choice
    
    case $choice in
      1)
        run_web_server
        ;;
      2)
        run_agents
        ;;
      3)
        run_full_stack
        ;;
      4)
        run_monitor_only
        ;;
      5)
        run_keyword_discovery
        ;;
      6)
        run_wcag_scanner
        ;;
      7)
        run_production
        ;;
      8)
        echo "Goodbye! 👋"
        exit 0
        ;;
      *)
        echo "Invalid choice. Please select 1-8."
        ;;
    esac
  done
}

# Run with provided argument if given
if [ $# -eq 1 ]; then
  case $1 in
    web)
      run_web_server
      ;;
    agents)
      run_agents
      ;;
    full-stack)
      run_full_stack
      ;;
    monitor)
      run_monitor_only
      ;;
    keyword)
      run_keyword_discovery
      ;;
    scanner)
      run_wcag_scanner
      ;;
    prod)
      run_production
      ;;
    *)
      echo "Usage: ./run-workload.sh [web|agents|full-stack|monitor|keyword|scanner|prod]"
      main
      ;;
  esac
else
  main
fi
