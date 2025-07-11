import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, ErrorRequestHandler, Response } from 'express';
import httpStatus from 'http-status';
import morgan from 'morgan';
import path from 'path';
import session from 'express-session';
import GlobalErrorHandler from './app/middlewares/globalErrorHandler';
import { defaultLimiter } from './app/middlewares/rateLimit';
import router from './app/routes';
import logger from './app/utils/logger';
import helmet from 'helmet';

const app: Application = express();
const morganFormat = ':method :url :status :response-time ms';

const corsOptions = {
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

// 🔧 Middleware setup
app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(defaultLimiter);
// app.set('trust proxy', true);
// router.use(restrictToNordVPN());

// 📂 Static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// // 📋 Logging
// app.use(morgan('dev'));
// app.use(
//   morgan(morganFormat, {
//     stream: {
//       write: (message) => {
//         const logObject = {
//           method: message.split(' ')[0],
//           url: message.split(' ')[1],
//           status: message.split(' ')[2],
//           responseTime: message.split(' ')[3],
//         };
//         logger.info(JSON.stringify(logObject));
//       },
//     },
//   }),
// );

app.use(
  session({
    secret: 'fde4fb19db80d6ba1c624b4bc',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' },
  }),
);

// 🌐 Base route
app.get('/', (_req, res: Response) => {
  res.send({ message: 'Welcome to the API!' });
});

// 🚀 API routes
app.use('/api/v1', router);

// ❌ 404 Not Found handler
app.use((req, res) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: 'API NOT FOUND!',
    error: {
      path: req.originalUrl,
      message: 'Your requested path is not found!',
    },
  });
});

// 🛑 Global Error Handler

app.use(GlobalErrorHandler as ErrorRequestHandler);

export default app;
