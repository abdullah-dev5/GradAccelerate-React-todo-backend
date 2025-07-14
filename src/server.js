import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import tasksRoutes from './routes/tasks.js';
import { connectDB, checkDBHealth } from './utils/prisma.js';
import { API } from './utils/constants.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './utils/swagger.js';

const app = express();

// ======================
// Security Middleware
// ======================
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many requests, please try again later'
    }
});
app.use(limiter);

// ======================
// Body Parsing
// ======================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ======================
// Request Logging
// ======================
if (process.env.NODE_ENV === 'development') {
    const morgan = await import('morgan');
    app.use(morgan.default('dev'));

    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        next();
    });
}

// ======================
// Database Connection
// ======================
let prisma;
try {
    prisma = await connectDB();
    console.log('Database connection established');
} catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
}

// ======================
// API Documentation
// ======================
app.use(API.DOCS_PATH, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ======================
// API Routes
// ======================
app.use(`${API.BASE_PATH}/tasks`, tasksRoutes);

// ======================
// Health Checks
// ======================
app.get(`${API.BASE_PATH}/health`, async (req, res) => {
    const dbHealth = await checkDBHealth();
    const status = dbHealth.status === 'healthy' ? 200 : 503;

    res.status(status).json({
        status: dbHealth.status,
        version: API.VERSION,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbHealth
    });
});

// ======================
// Error Handling
// ======================
app.use((req, res, next) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

app.use((err, req, res, next) => {
    const status = err.status || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    console.error(`[Error] ${status} - ${err.message}`);
    console.error(err.stack);

    res.status(status).json({
        error: isProduction ? 'Internal Server Error' : err.message,
        ...(!isProduction && { stack: err.stack }),
        ...(err.details && { details: err.details })
    });
});

// ======================
// Server Initialization
// ======================
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`API Docs: http://localhost:${PORT}${API.DOCS_PATH}`);
});

// ======================
// Graceful Shutdown
// ======================
const shutdown = async (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);

    try {
        await prisma.$disconnect();
        console.log('Database connection closed');

        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });

        // Force shutdown after 5 seconds
        setTimeout(() => {
            console.error('Forcing shutdown...');
            process.exit(1);
        }, 5000);
    } catch (err) {
        console.error('Shutdown error:', err);
        process.exit(1);
    }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    shutdown('UNHANDLED_REJECTION');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    shutdown('UNCAUGHT_EXCEPTION');
});