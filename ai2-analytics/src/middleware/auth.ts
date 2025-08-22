// --- 📦 ANALYTICS SERVICE AUTHENTICATION ---
// embracingearth.space - Enterprise Security

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

/**
 * JWT authentication for analytics endpoints
 * NO HARDCODED SECRETS
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required for analytics' 
    });
  }

  // CRITICAL: No fallback secrets
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('CRITICAL: JWT_SECRET not configured for analytics service');
    return res.status(500).json({ 
      success: false,
      error: 'Server configuration error' 
    });
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: 'ai2-platform'
    }) as any;

    req.user = {
      id: decoded.userId || decoded.sub,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName
    };

    // Audit log for analytics access
    console.log(`📊 Analytics Access: ${req.user.email} - ${req.method} ${req.path}`);
    
    next();
  } catch (error: any) {
    console.error('Analytics auth failed:', error.message);
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
};

/**
 * Optional auth for public analytics endpoints
 */
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // No token provided, continue without user context
    return next();
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Configuration error, but allow public access
    console.warn('JWT_SECRET not configured, skipping optional auth');
    return next();
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: 'ai2-platform'
    }) as any;

    req.user = {
      id: decoded.userId || decoded.sub,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName
    };
  } catch (error) {
    // Invalid token, continue without user context
    console.debug('Optional auth failed, continuing as anonymous');
  }

  next();
};


