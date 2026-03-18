const path = require('path');
const runNextDevScript = path.join(__dirname, 'scripts', 'run-next-dev.cjs');

module.exports = {
    apps: [
        {
            name: 'auth-service',
            cwd: './apps/backend/auth-service-js',
            script: 'node',
            args: ['server.js'],
            instances: 1,
            exec_mode: 'fork',
            windowsHide: true,
            autorestart: true,
            watch: false,
            min_uptime: '10s',
            max_restarts: 20,
            max_memory_restart: '1G',
            restart_delay: 3000,
            exp_backoff_restart_delay: 1000,
            error_file: './logs/auth-service-error.log',
            out_file: './logs/auth-service-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            env: {
                NODE_ENV: 'development',
                PORT: 3001,
                USER_SERVICE_PORT: 3002,
                DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5433/xclone_db?connect_timeout=5",
                JWT_SECRET: "dev-secret",
                NEXTAUTH_SECRET: "dev-secret"
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3001,
                USER_SERVICE_PORT: 3002,
                DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5433/xclone_db?connect_timeout=5",
                JWT_SECRET: "dev-secret",
                NEXTAUTH_SECRET: "dev-secret"
            }
        },
        // ... (auth-service config - keeping as is, but ensure secrets match if needed for dev/prod parity in this local setup)

        {
            name: 'socket-server',
            cwd: './apps/backend/auth-service-js',
            script: 'socket-server.js',
            instances: 1,
            exec_mode: 'fork',
            windowsHide: true,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            error_file: './logs/socket-server-error.log',
            out_file: './logs/socket-server-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            env: {
                NODE_ENV: 'development',
                PORT: 3013,
                JWT_SECRET: "dev-secret"
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3013,
                JWT_SECRET: "dev-secret"
            }
        },
        {
            name: 'user-service',
            cwd: './apps/services/user',
            script: 'src/index.js',
            interpreter: 'node',
            instances: 1,
            exec_mode: 'fork',
            windowsHide: true,
            autorestart: true,
            watch: false,
            min_uptime: '10s',
            max_restarts: 20,
            max_memory_restart: '500M',
            restart_delay: 3000,
            exp_backoff_restart_delay: 1000,
            error_file: './logs/user-service-error.log',
            out_file: './logs/user-service-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            env: {
                NODE_ENV: 'development',
                PORT: 3002,
                DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5433/xclone_db",
                JWT_SECRET: "dev-secret"
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3002,
                DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5433/xclone_db",
                JWT_SECRET: "dev-secret"
            }
        },
        // ... (User and Content - KEEP AS IS: src/index.js)
        {
            name: 'content-service',
            cwd: './apps/services/content',
            script: 'src/index.js',
            interpreter: 'node',
            instances: 1,
            exec_mode: 'fork',
            windowsHide: true,
            autorestart: true,
            watch: false,
            min_uptime: '10s',
            max_restarts: 20,
            max_memory_restart: '500M',
            restart_delay: 3000,
            exp_backoff_restart_delay: 1000,
            error_file: './logs/content-service-error.log',
            out_file: './logs/content-service-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            env: {
                NODE_ENV: 'development',
                PORT: 3003,
                DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5433/xclone_db",
                JWT_SECRET: "dev-secret",
                KAFKA_BROKER: "localhost:9093",
                KAFKAJS_NO_PARTITIONER_WARNING: "1"
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3003,
                DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5433/xclone_db",
                JWT_SECRET: "dev-secret"
            }
        },
        {
            name: 'timeline-service',
            cwd: './apps/services/timeline',
            script: runNextDevScript,
            instances: 1,
            exec_mode: 'fork',
            windowsHide: true,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            error_file: './logs/timeline-service-error.log',
            out_file: './logs/timeline-service-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            env: {
                NODE_ENV: 'development',
                PORT: 3004,
                DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5433/xclone_db",
                JWT_SECRET: "dev-secret"
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3004,
                DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5433/xclone_db",
                JWT_SECRET: "dev-secret"
            }
        },
        {
            name: 'notification-service',
            cwd: './apps/services/notification',
            script: runNextDevScript,
            instances: 1,
            exec_mode: 'fork',
            windowsHide: true,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            error_file: './logs/notification-service-error.log',
            out_file: './logs/notification-service-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            env: {
                NODE_ENV: 'development',
                PORT: 3005,
                DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5433/xclone_db",
                KAFKA_BROKER: "localhost:9092",
                KAFKAJS_NO_PARTITIONER_WARNING: "1"
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3005,
                DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5433/xclone_db",
                KAFKA_BROKER: "localhost:9092"
            }
        },
        {
            name: 'search-service',
            cwd: './apps/services/search',
            script: runNextDevScript,
            instances: 1,
            exec_mode: 'fork',
            windowsHide: true,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            error_file: './logs/search-service-error.log',
            out_file: './logs/search-service-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            env: {
                NODE_ENV: 'development',
                PORT: 3006,
                ELASTICSEARCH_URL: "http://localhost:9200",
                KAFKA_BROKER: "localhost:9092",
                KAFKAJS_NO_PARTITIONER_WARNING: "1"
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3006,
                ELASTICSEARCH_URL: "http://localhost:9200",
                KAFKA_BROKER: "localhost:9092"
            }
        },
        {
            name: 'messaging-service',
            cwd: './apps/services/messaging',
            script: 'node',
            args: ['server.js'],
            instances: 1,
            exec_mode: 'fork',
            windowsHide: true,
            autorestart: true,
            watch: false,
            min_uptime: '10s',
            max_restarts: 20,
            max_memory_restart: '500M',
            restart_delay: 3000,
            exp_backoff_restart_delay: 1000,
            error_file: './logs/messaging-service-error.log',
            out_file: './logs/messaging-service-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            env: {
                NODE_ENV: 'development',
                PORT: 3019,
                DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5433/xclone_db",
                JWT_SECRET: "dev-secret",
                KAFKA_BROKER: "localhost:9092",
                KAFKAJS_NO_PARTITIONER_WARNING: "1"
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3019,
                DATABASE_URL: "postgresql://postgres:root@localhost:5432/xclone_db",
                JWT_SECRET: "dev-secret",
                KAFKA_BROKER: "localhost:9092"
            }
        },

        {
            name: 'monetization-service',
            cwd: './apps/services/monetization',
            script: 'src/index.js',
            interpreter: 'node',
            instances: 1,
            exec_mode: 'fork',
            windowsHide: true,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            error_file: './logs/monetization-service-error.log',
            out_file: './logs/monetization-service-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            env: {
                NODE_ENV: 'development',
                PORT: 3014,
                DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5433/xclone_db",
                JWT_SECRET: "dev-secret"
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3014,
                DATABASE_URL: "postgresql://postgres:root@localhost:5432/xclone_db",
                JWT_SECRET: "dev-secret"
            }
        },

        {
            name: 'analytics-service',
            cwd: './apps/services/analytics',
            script: runNextDevScript,
            instances: 1,
            exec_mode: 'fork',
            windowsHide: true,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            error_file: './logs/analytics-service-error.log',
            out_file: './logs/analytics-service-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            env: {
                NODE_ENV: 'development',
                PORT: 3009,
                USER_SERVICE_URL: "http://127.0.0.1:3002",
                CONTENT_SERVICE_URL: "http://127.0.0.1:3003",
                DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5433/xclone_db",
                JWT_SECRET: "dev-secret"
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3009,
                DATABASE_URL: "postgresql://postgres:root@localhost:5432/xclone_db",
                JWT_SECRET: "dev-secret"
            }
        },
        {
            name: 'moderation-service',
            cwd: './apps/services/moderation',
            script: runNextDevScript,
            instances: 1,
            exec_mode: 'fork',
            windowsHide: true,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            error_file: './logs/moderation-service-error.log',
            out_file: './logs/moderation-service-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            env: {
                NODE_ENV: 'development',
                PORT: 3010,
                DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5433/xclone_db",
                JWT_SECRET: "dev-secret"
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3010,
                DATABASE_URL: "postgresql://postgres:root@localhost:5432/xclone_db",
                JWT_SECRET: "dev-secret"
            }
        },
        {
            name: 'settings-service',
            cwd: './apps/services/settings',
            script: runNextDevScript,
            instances: 1,
            exec_mode: 'fork',
            windowsHide: true,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            error_file: './logs/settings-service-error.log',
            out_file: './logs/settings-service-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            env: {
                NODE_ENV: 'development',
                PORT: 3011,
                DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5433/xclone_db",
                JWT_SECRET: "dev-secret"
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3011,
                DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5433/xclone_db",
                JWT_SECRET: "dev-secret"
            }
        },
        {
            name: 'client',
            cwd: './apps/client',
            script: 'run-vite.cjs',
            instances: 1,
            exec_mode: 'fork',
            windowsHide: true,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            error_file: './logs/client-error.log',
            out_file: './logs/client-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            env: {
                NODE_ENV: 'development',
                // Leave VITE_API_URL unset so API uses same-origin (relative URLs).
                // Vite proxy forwards /api to gateway; works when accessing via IP (e.g. 192.168.1.37:5173).
                // VITE_API_URL: 'http://localhost:3001' breaks access from other devices (their localhost != dev machine).
            }
        },
        {
            name: 'admin-panel',
            cwd: './apps/admin',
            script: 'run-vite.cjs',
            instances: 1,
            exec_mode: 'fork',
            windowsHide: true,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            error_file: './logs/admin-panel-error.log',
            out_file: './logs/admin-panel-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            env: {
                NODE_ENV: 'development'
            },
        },
        {
            name: 'admin-backend',
            cwd: './adminBackend',
            script: runNextDevScript,
            instances: 1,
            exec_mode: 'fork',
            windowsHide: true,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            error_file: './logs/admin-backend-error.log',
            out_file: './logs/admin-backend-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            env: {
                NODE_ENV: 'development',
                PORT: 3012,
                DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5433/xclone_db",
                JWT_SECRET: "dev-secret"
            }
        }
    ]
};
