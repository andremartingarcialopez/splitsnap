import cors from 'cors';
import { env } from './env';

/** CORS alineado al origen del frontend (MDD §6). */
export const corsMiddleware = cors({
  origin: env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
});
