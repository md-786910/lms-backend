export const apps = [
  {
    name: "app",
    script: "npm",
    args: "run dev",
    watch: true,
    ignore_watch: ["node_modules", "logs", "uploads", "temp"],
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

  // {
  //     name: 'soloQueueProcessor',
  //     script: './src/workers/emailQueueProcessors.js',
  //     autorestart: true,
  // },
  // {
  //     name: 'backgroundQueueProcessor',
  //     script: './processors/backgroundQueueProcessor.js',
  //     autorestart: true,
  // },
  // {
  //     name: 'imapListener',
  //     script: './processors/imapListener.js',
  //     autorestart: true,
  // },
];
