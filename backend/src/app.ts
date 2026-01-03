import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import locationRoutes from './routes/location.routes';
import fareRoutes from './routes/fare.routes';
import tripRoutes from './routes/trip.routes';
import driverRoutes from './routes/driver.routes';
import safetyRoutes from './routes/safety.routes';
import scheduledRoutes from './routes/scheduled.routes';

// Create Express app
const app: Application = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  })
);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    messageAr: 'طلبات كثيرة جداً، يرجى المحاولة لاحقاً',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    messageAr: 'الخادم يعمل',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API info
app.get('/api', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Wasalni API',
    messageAr: 'واجهة برمجة تطبيقات وصّلني',
    version: config.apiVersion,
    documentation: '/api/docs',
  });
});

// API Routes
app.use(`/api/${config.apiVersion}/auth`, authRoutes);
app.use(`/api/${config.apiVersion}/location`, locationRoutes);
app.use(`/api/${config.apiVersion}/fare`, fareRoutes);
app.use(`/api/${config.apiVersion}/trips`, tripRoutes);
app.use(`/api/${config.apiVersion}/driver`, driverRoutes);
app.use(`/api/${config.apiVersion}/safety`, safetyRoutes);
app.use(`/api/${config.apiVersion}/scheduled`, scheduledRoutes);
// app.use(`/api/${config.apiVersion}/users`, userRoutes);
// app.use(`/api/${config.apiVersion}/admin`, adminRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
