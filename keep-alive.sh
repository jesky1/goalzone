#!/bin/bash
# GOALZONE Auto-Restart Script
# Keeps Next.js dev server alive in sandbox environment
cd /home/z/my-project

while true; do
  pkill -f "next dev" 2>/dev/null
  sleep 2
  
  NODE_OPTIONS="--max-old-space-size=256" node node_modules/.bin/next dev -p 3000 &
  SERVER_PID=$!
  
  # Wait for ready
  for i in $(seq 1 10); do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ --max-time 3 2>/dev/null | grep -q "200"; then
      echo "[$(date)] Server UP (PID: $SERVER_PID)"
      break
    fi
    sleep 1
  done
  
  # Wait for process to exit
  wait $SERVER_PID 2>/dev/null
  echo "[$(date)] Server died, restarting in 2s..."
  sleep 2
done
