/**
 * @file ecosystem.config.js
 * @description Defines the configuration for managing and deploying the application using PM2,
 * a production process manager for Node.js applications. This file provides a centralized
 * definition for application settings, environment variables, logging, and deployment strategies.
 * @see {@link https://pm2.io/docs/runtime/guide/ecosystem-file/ PM2 Ecosystem File Documentation}
 */

// @ts-check

/**
 * @type {object}
 * @description The main configuration object for PM2. It contains an array of application process descriptions.
 */
const config = {
  /**
   * @property {import('pm2').ProcessDescription[]} apps
   * @description An array of application declarations. Each object in this array represents a process that PM2 will manage.
   */
  apps: [
    {
      // #region Application Identity & Source

      /**
       * @property {string} name
       * @description A unique and descriptive name for the application process. This name will be used to identify and manage the app via the PM2 CLI (e.g., `pm2 stop XArch`).
       */
      name: 'XArch-WhatsApp',

      /**
       * @property {string} script
       * @description The entry point script for the application. Since this is a TypeScript project, we point to the compiled JavaScript output file in the `dist` directory.
       */
      script: './dist/index.js',

      /**
       * @property {string} interpreter
       * @description The interpreter to be used to execute the script. Explicitly set to 'node' to ensure the script is run with the Node.js runtime.
       * @default 'node'
       */
      interpreter: 'node',

      /**
       * @property {string} cwd
       * @description The working directory from which the application will be launched. Setting this to the project root ensures that all relative paths within the application resolve correctly.
       */
      cwd: './',

      // #endregion

      // #region Execution & Performance

      /**
       * @property {number | 'max'} instances
       * @description The number of application instances to be launched in cluster mode. For this configuration, we use 1 instance, which runs the app in 'fork' mode. To leverage all available CPU cores, you could set this to 'max'.
       * @default 1
       */
      instances: 1,

      /**
       * @property {'cluster' | 'fork'} exec_mode
       * @description The execution mode for the application. 'fork' mode is suitable for a single instance. Use 'cluster' when `instances` is greater than 1 to enable load balancing across multiple cores.
       * @default 'fork'
       */
      exec_mode: 'fork',

      /**
       * @property {string} max_memory_restart
       * @description If the application's memory usage exceeds this value, PM2 will automatically restart it. This is a critical safeguard against memory leaks. '500M' provides a reasonable ceiling for a medium sized Node.js application.
       */
      max_memory_restart: '500M',

      // #endregion

      // #region Restart & Reliability

      /**
       * @property {boolean} autorestart
       * @description A flag to enable or disable the automatic restart of the application if it crashes or exits. We set this to `true` to ensure high availability. PM2 will immediately attempt to bring the application back online after a failure.
       * @default true
       */
      autorestart: true,

      /**
       * @property {number} restart_delay
       * @description The delay in milliseconds before PM2 attempts to restart a crashed application. A 1000ms (1 second) delay prevents rapid, successive restart loops in case of a persistent startup failure.
       * @default 0
       */
      restart_delay: 1000,

      /**
       * @property {number} kill_timeout
       * @description The time in milliseconds that PM2 will wait for the application to gracefully shut down before forcefully killing it. A 5000ms (5 seconds) timeout gives the application ample time to close database connections and finish ongoing requests.
       * @default 1600
       */
      kill_timeout: 5000,

      /**
       * @property {number} listen_timeout
       * @description The time in milliseconds that PM2 will wait for a 'ready' signal from the application on startup. This is useful for applications that need time to initialize before they can accept connections.
       */
      listen_timeout: 5000,

      // #endregion

      // #region Logging & Monitoring

      /**
       * @property {string} error_file
       * @description The file path for storing standard error streams (stderr). Centralizes all application errors into a dedicated log file for easier debugging.
       */
      error_file: 'logs/pm2/app-err.log',

      /**
       * @property {string} out_file
       * @description The file path for storing standard output streams (stdout). Captures all standard logs (e.g., from `console.log`) in a single file.
       */
      out_file: 'logs/pm2/app-out.log',

      /**
       * @property {boolean} merge_logs
       * @description A flag to combine the `error_file` and `out_file` into a single log file. We set this to `true` to see logs in chronological order, which provides better context when debugging issues.
       * @default false
       */
      merge_logs: true,

      /**
       * @property {string} log_date_format
       * @description The format for timestamps prefixed to each log entry. Using a standard 'YYYY-MM-DD HH:mm:ss.SSS' format ensures logs are easily sortable and parsable.
       */
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',

      // #endregion

      // #region Environment Management

      /**
       * @property {object} env
       * @description Defines environment variables that will be available to the application. The `env` object specifies the default variables. These variables are applied unless a more specific environment (e.g., `env_production`) is used.
       */
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },

      /**
       * @property {object} env_production
       * @description Defines environment variables specifically for the 'production' environment. These variables are injected when starting the app with `pm2 start ecosystem.config.js --env production`. They override any variables defined in the default `env` object.
       */
      env_production: {
        NODE_ENV: 'production',
        PORT: 80,
      },

      /**
       * @property {object} env_development
       * @description Defines environment variables specifically for the 'development' environment. These are used when starting with `pm2 start ecosystem.config.js --env development`.
       */
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },

      // #endregion

      // #region Development & Watch Mode

      /**
       * @property {boolean | string[]} watch
       * @description Enables PM2's watch feature, which automatically restarts the application when files change. We specify an array of paths (`['src']`) to watch only our source TypeScript files, making the feature more efficient. This is highly useful for development.
       * @default false
       */
      watch: ['src'],

      /**
       * @property {string[]} ignore_watch
       * @description An array of paths or glob patterns to be ignored by the watch feature. It is critical to ignore directories like `node_modules`, `dist`, and `logs` to prevent unnecessary or infinite restart loops.
       * @default ["node_modules", ".git"]
       */
      ignore_watch: ['node_modules', 'dist', '.git', 'logs'],

      // #endregion
    },
  ],

  // #region Deployment (Optional)

  /**
   * @description A section for configuring PM2's deployment features, allowing you to deploy or update
   * applications on remote servers via SSH.
   * @see {@link https://pm2.io/docs/runtime/guide/easy-deploy-with-ssh/ PM2 Deployment Documentation}
   */
  // deploy: {
  //    production: {
  //      user: 'your_ssh_user',
  //      host: 'your_server_ip',
  //      ref: 'origin/main',
  //      repo: 'your_git_repo_url',
  //      path: '/var/www/production',
  //      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
  //    },
  // },

  // #endregion
};

module.exports = config;
