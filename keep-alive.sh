#!/bin/bash
while true; do
  cd /home/z/my-project
  npx next dev -p 3000 2>&1 | tee -a /home/z/my-project/dev.log
  echo "=== SERVER CRASHED - RESTARTING IN 3s ===" >> /home/z/my-project/dev.log
  sleep 3
done
