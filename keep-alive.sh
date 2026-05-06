#!/bin/bash
cd /home/z/my-project
while true; do
  echo "Starting server at $(date)..." >> /home/z/my-project/dev.log
  node .next/standalone/server.js >> /home/z/my-project/dev.log 2>&1
  EXIT_CODE=$?
  echo "Server exited with code $EXIT_CODE, restarting in 2s..." >> /home/z/my-project/dev.log
  sleep 2
done
