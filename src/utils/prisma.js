import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

// Configuration based on environment
const prismaOptions = {
    errorFormat: process.env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    },
};

// Enhanced logging in non-production environments
if (process.env.NODE_ENV !== 'production') {
    prismaOptions.log = [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
        { level: 'info', emit: 'event' }
    ];
}

// Initialize Prisma Client with singleton pattern
const prisma = new PrismaClient(prismaOptions);

// Connection state management
let isConnected = false;
let connectionStartTime;

// Development logging handlers
if (process.env.NODE_ENV !== 'production') {
    prisma.$on('query', (e) => {
        const queryTime = performance.now();
        console.log('\n--- Prisma Query ---');
        console.log('Query:', e.query);
        console.log('Params:', e.params);
        console.log('Duration:', e.duration + 'ms');
        console.log('Timestamp:', new Date().toISOString());
        console.log('Performance:', (performance.now() - queryTime).toFixed(2) + 'ms');
    });

    prisma.$on('error', (e) => {
        console.error('\n--- Prisma Error ---');
        console.error('Message:', e.message);
        console.error('Code:', e.code || 'N/A');
        console.error('Timestamp:', new Date().toISOString());
    });

    prisma.$on('warn', (e) => {
        console.warn('\n--- Prisma Warning ---');
        console.warn('Message:', e.message);
        console.warn('Timestamp:', new Date().toISOString());
    });

    prisma.$on('info', (e) => {
        console.info('\n--- Prisma Info ---');
        console.info('Message:', e.message);
        console.info('Timestamp:', new Date().toISOString());
    });
}

/**
 * Connects to the database and returns the Prisma client
 * @returns {Promise<PrismaClient>}
 */
export async function connectDB() {
    if (!isConnected) {
        connectionStartTime = performance.now();
        try {
            await prisma.$connect();
            isConnected = true;
            const connectionTime = performance.now() - connectionStartTime;
            console.log(`\n--- Database Connection ---`);
            console.log(`Status: Connected`);
            console.log(`Duration: ${connectionTime.toFixed(2)}ms`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Database: ${process.env.DATABASE_TYPE || 'SQLite'}`);
        } catch (error) {
            console.error('\n--- Database Connection Failed ---');
            console.error('Error:', error.message);
            console.error('Stack:', error.stack);
            throw error;
        }
    }
    return prisma;
}

/**
 * Disconnects from the database
 * @returns {Promise<void>}
 */
export async function disconnectDB() {
    if (isConnected) {
        try {
            await prisma.$disconnect();
            isConnected = false;
            console.log('\n--- Database Disconnected ---');
        } catch (error) {
            console.error('\n--- Database Disconnection Failed ---');
            console.error('Error:', error.message);
            throw error;
        }
    }
}

// Clean shutdown handlers
process.on('beforeExit', disconnectDB);
process.on('SIGINT', disconnectDB);
process.on('SIGTERM', disconnectDB);

// Health check function
export async function checkDBHealth() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

// Export the Prisma client
export default prisma;