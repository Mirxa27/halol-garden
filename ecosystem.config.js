/**
 * PM2 Ecosystem Configuration
 * Process management for production deployment
 */

module.exports = {
  apps: [
    {
      name: 'medical-devices-web',
      script: 'npm',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/pm2-web-error.log',
      out_file: './logs/pm2-web-out.log',
      log_file: './logs/pm2-web-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'medical-devices-websocket',
      script: './server/websocket/index.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/pm2-ws-error.log',
      out_file: './logs/pm2-ws-out.log',
      log_file: './logs/pm2-ws-combined.log',
      time: true,
    },
    {
      name: 'medical-devices-worker',
      script: './server/workers/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      cron_restart: '0 */6 * * *', // Restart every 6 hours
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/pm2-worker-error.log',
      out_file: './logs/pm2-worker-out.log',
      log_file: './logs/pm2-worker-combined.log',
      time: true,
    },
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: process.env.PRODUCTION_HOST,
      ref: 'origin/main',
      repo: 'git@github.com:your-org/medical-devices-marketplace.git',
      path: '/var/www/medical-devices',
      'pre-deploy': 'git pull',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      env: {
        NODE_ENV: 'production',
      },
    },
    staging: {
      user: 'deploy',
      host: process.env.STAGING_HOST,
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/medical-devices-marketplace.git',
      path: '/var/www/medical-devices-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging',
      },
    },
  },
};