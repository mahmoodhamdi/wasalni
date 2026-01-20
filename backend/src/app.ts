import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { config } from './config';
import { swaggerSpec } from './config/swagger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import locationRoutes from './routes/location.routes';
import fareRoutes from './routes/fare.routes';
import tripRoutes from './routes/trip.routes';
import driverRoutes from './routes/driver.routes';
import safetyRoutes from './routes/safety.routes';
import scheduledRoutes from './routes/scheduled.routes';
import promoRoutes from './routes/promo.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';
import paymentRoutes from './routes/payment.routes';
import chatRoutes from './routes/chat.routes';
import passengerRoutes from './routes/passenger.routes';

// Create Express app
const app: Application = express();

// Trust proxy for ngrok/reverse proxy (required for rate-limiter to work correctly)
app.set('trust proxy', 1);

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
  max: config.nodeEnv === 'development' ? 1000 : 100, // Higher limit for development
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

// Swagger API Documentation
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Wasalni API Documentation',
    customfavIcon: '/favicon.ico',
  })
);

// Swagger JSON endpoint
app.get('/api/docs/swagger.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Redoc documentation (alternative UI)
app.get('/api/docs/redoc', (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Wasalni API - Redoc</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
        <style>body { margin: 0; padding: 0; }</style>
      </head>
      <body>
        <redoc spec-url='/api/docs/swagger.json'></redoc>
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
      </body>
    </html>
  `);
});

// API Routes
app.use(`/api/${config.apiVersion}/auth`, authRoutes);
app.use(`/api/${config.apiVersion}/location`, locationRoutes);
app.use(`/api/${config.apiVersion}/fare`, fareRoutes);
app.use(`/api/${config.apiVersion}/trips`, tripRoutes);
app.use(`/api/${config.apiVersion}/driver`, driverRoutes);
app.use(`/api/${config.apiVersion}/safety`, safetyRoutes);
app.use(`/api/${config.apiVersion}/scheduled`, scheduledRoutes);
app.use(`/api/${config.apiVersion}/promo`, promoRoutes);
app.use(`/api/${config.apiVersion}/admin`, adminRoutes);
app.use(`/api/${config.apiVersion}/notifications`, notificationRoutes);
app.use(`/api/${config.apiVersion}/payment`, paymentRoutes);
app.use(`/api/${config.apiVersion}/chat`, chatRoutes);
app.use(`/api/${config.apiVersion}/passenger`, passengerRoutes);

// Static file serving for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
