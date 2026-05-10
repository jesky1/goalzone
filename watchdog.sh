#!/bin/bash
cd /home/z/my-project
while true; do
    if ! pgrep -f "next dev" > /dev/null 2>&1; then
        echo "[$(date)] Starting dev server..." >> /home/z/my-project/dev.log
        bun run dev >> /home/z/my-project/dev.log 2>&1 &
        SERVER_PID=$!
        echo "[$(date)] Server PID: $SERVER_PID" >> /home/z/my-project/dev.log
        sleep 5
    fi
    sleep 3
done
