import rateLimit from 'express-rate-limit'

/* $$ generous global guard against abuse/DoS — normal page use stays well under this $$ */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please slow down.' },
})

/* $$ tight guard on login/register specifically, to blunt brute-force and credential stuffing $$ */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later.' },
})
