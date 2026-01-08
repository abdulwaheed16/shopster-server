module.exports = {
  apps: [
    {
      name: "shopster-api",
      script: "./dist/server.js",
      env: {
        NODE_ENV: "production",
        WORKER_MODE: "false", // Explicitly tell server NOT to run workers
      },
      instances: "max",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
    },
    {
      name: "shopster-worker",
      script: "./dist/worker.js",
      env: {
        NODE_ENV: "production",
        WORKER_MODE: "true", // This process ONLY runs workers
      },
      instances: "max",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
    },
  ],
};
