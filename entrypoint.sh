#!/bin/sh

echo "Starting container with SERVER_ENV='$SERVER_ENV'"


if [ "$SERVER_ENV" = "development" ]; then
  echo "Running in development mode with nodemon..."
  pm2 start /app/pm2.config.js

else
  echo "Running in production mode with pm2-runtime..."
  exec pm2-runtime start /app/pm2.config.js
fi
