import cors from 'cors';
import { env } from './env';

/** CORS alineado al origen del frontend (MDD §6). */
export const corsMiddleware = cors({
  origin: env.corsOrigins.length === 1 ? env.corsOrigins[0] : env.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
});
