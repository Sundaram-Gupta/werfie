module.exports = {
    apps: [
        {
            name: 'auth-service',
            cwd: './apps/backend/auth-service-js',
            script: 'npx',
            args: 'next dev -p 3012',
            env: { PORT: 3012, DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5432/xclone_db", JWT_SECRET: "dev-secret", NEXTAUTH_SECRET: "dev-secret" }
        },
        {
            name: 'user-service',
            cwd: './apps/services/user',
            script: 'npm',
            args: 'run dev',
            env: { PORT: 3002, DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5432/xclone_db", JWT_SECRET: "dev-secret" }
        },
        {
            name: 'content-service',
            cwd: './apps/services/content',
            script: 'npm',
            args: 'run dev',
            env: { PORT: 3003, DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5432/xclone_db", JWT_SECRET: "dev-secret" }
        },
        {
            name: 'timeline-service',
            cwd: './apps/services/timeline',
            script: 'npm',
            args: 'run dev',
            env: { PORT: 3004, DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5432/xclone_db", JWT_SECRET: "dev-secret" }
        },
        {
            name: 'notification-service',
            cwd: './apps/services/notification',
            script: 'npm',
            args: 'run dev',
            env: { PORT: 3005, DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5432/xclone_db", KAFKA_BROKER: "localhost:9092" }
        },
        {
            name: 'search-service',
            cwd: './apps/services/search',
            script: 'npm',
            args: 'run dev',
            env: { PORT: 3006, ELASTICSEARCH_URL: "http://localhost:9200", KAFKA_BROKER: "localhost:9092" }
        },
        {
            name: 'messaging-service',
            cwd: './apps/services/messaging',
            script: 'npm',
            args: 'run dev',
            env: { PORT: 3007, DATABASE_URL: "postgresql://xclone:xclone_dev_password@localhost:5432/xclone_db", KAFKA_BROKER: "localhost:9092" }
        },
        {
            name: 'media-service',
            cwd: './apps/services/media',
            script: 'npm',
            args: 'run dev',
            env: { PORT: 3008 }
        },
        {
            name: 'analytics-service',
            cwd: './apps/services/analytics',
            script: 'npm',
            args: 'run dev',
            env: { PORT: 3009 }
        },
        {
            name: 'moderation-service',
            cwd: './apps/services/moderation',
            script: 'npm',
            args: 'run dev',
            env: { PORT: 3010 }
        },
        {
            name: 'settings-service',
            cwd: './apps/services/settings',
            script: 'npm',
            args: 'run dev',
            env: { PORT: 3011 }
        }
    ]
};
