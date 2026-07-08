import rateLimit from 'express-rate-limit';

const limitPayload = {
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests; retry later',
    error: { code: 'RATE_LIMIT', details: null },
  },
};

/** Límite general por IP en toda la API */
export const apiRateLimit = rateLimit({
  windowMs: 60_000,
  max: 200,
  ...limitPayload,
});

/** Rate limit estricto para OCR/IA/pipeline (MDD §6) */
export const pipelineRateLimit = rateLimit({
  windowMs: 60_000,
  max: 10,
  ...limitPayload,
  message: {
    success: false,
    message: 'Too many pipeline requests; retry in a minute',
    error: { code: 'RATE_LIMIT', details: null },
  },
});
