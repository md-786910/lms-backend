#!/bin/sh

echo "Starting container with NODE_ENV='$NODE_ENV'"

# Wait for dependencies (optional)
# sleep 5

if [ "$NODE_ENV" = "development" ]; then
    echo "Running in development mode with PM2..."
    exec pm2-runtime start /usr/src/app/pm2.config.js --env development
else
    echo "Running in production mode with PM2..."
    exec pm2-runtime start /usr/src/app/pm2.config.js --env production
fi