require('dotenv').config();

let express = require('express');
let session = require('express-session');
let mongoose = require('mongoose');
let cookieParser = require('cookie-parser');
let cors = require("cors");
let http = require("http");
let helmet = require('helmet');
let morgan = require('morgan');
const fileUpload = require('express-fileupload'); // Add this
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
console.log('Server running on port:', PORT);

// Middleware to parse JSON
console.log(process.env.SECRET_KEY);
app.use(express.json({ limit: '50mb' })); // Increase limit for file uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Add this for form data

app.use(cookieParser());

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Only secure in production
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" } // Allow file uploads
}));

// File upload middleware
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: require('os').tmpdir(), // Use system temp directory (works on all platforms)
    limits: { 
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    abortOnLimit: true,
    responseOnLimit: "File size limit has been reached",
    limitHandler: (req, res, next) => {
        res.status(413).json({
            success: false,
            message: 'File too large. Maximum size is 10MB.'
        });
    }
}));

app.use(morgan('dev'));

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// Handle cors
const corsOptions = {
    origin: [
        process.env.WEB_BASE_URL,
        process.env.SERVER_URL,
        `http://localhost:${PORT}`,
        `http://localhost:3000`,
        `http://localhost:5500`,
        `http://127.0.0.1:5500`,
        'https://Pivora-frontend.vercel.app',
        'https://Pivora.onrender.com',
        'https://Pivora.org',
        'https://pivoratrading.com'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Pivora API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        docExpansion: 'list',
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        tryItOutEnabled: true
    }
}));

// Sample route
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

app.get("/", (req, res) => {
    res.json({
        message: "Pivora API",
        version: "1.0.0",
        status: "Online",
        documentation: "/api-docs"
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Global error handler for file uploads
app.use((error, req, res, next) => {
    if (error instanceof Error && error.message.includes('LIMIT_FILE_SIZE')) {
        return res.status(413).json({
            success: false,
            message: 'File too large. Maximum size is 10MB.'
        });
    }
    
    if (error instanceof Error && error.message.includes('LIMIT_UNEXPECTED_FILE')) {
        return res.status(400).json({
            success: false,
            message: 'Unexpected file field.'
        });
    }

    // Log other errors
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// MongoDB connection
console.log(process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true
})
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated');
        mongoose.connection.close();
    });
});

// Import and initialize cron jobs
// const priceTrackingCron = require('./cronjob/index');

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Initialize cron jobs after server starts
    // priceTrackingCron.init();
});

// module.exports = app;
