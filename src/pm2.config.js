module.exports = {
  apps: [
    {
      name: "app",
      script: "npm",
      args: "run dev",
      watch: true, // or disable in production
      ignore_watch: ["node_modules", "logs", "uploads", "temp", "document"],
      watch_options: {
        followSymlinks: false,
      },
      env: {
        NODE_ENV: "development",
        PORT: 8000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8000,
      },
      autorestart: true,
    },
    {
      name: "cron",
      script: "/usr/sbin/crond",
      args: "-f -l 2", // -f = foreground, -l 2 = log level
      watch: false,
      autorestart: true, // keep it alive if it ever crashes
    },
  ],
};
