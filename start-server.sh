#!/bin/bash
cd /home/z/my-project
# Check if already running
if ss -tlnp | grep -q ":3000 "; then
  exit 0
fi
# Kill old processes
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 1
# Start dev server
nohup bun run dev > /home/z/my-project/dev.log 2>&1 &
disown
