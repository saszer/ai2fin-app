// --- 📦 NOTIFICATIONS SERVICE AUTHENTICATION ---
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
 * JWT authentication for notification endpoints
 * NO HARDCODED SECRETS
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required for notifications' 
    });
  }

  // CRITICAL: No fallback secrets
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('CRITICAL: JWT_SECRET not configured for notifications service');
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

    // Audit log for notification access
    console.log(`📧 Notification Access: ${req.user.email} - ${req.method} ${req.path}`);
    
    next();
  } catch (error: any) {
    console.error('Notification auth failed:', error.message);
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
};

/**
 * Service-to-service authentication for internal notification triggers
 */
export const serviceAuth = (req: Request, res: Response, next: NextFunction) => {
  const serviceToken = req.headers['x-service-token'] as string;
  
  const expectedToken = process.env.SERVICE_SECRET;
  if (!expectedToken) {
    console.error('CRITICAL: SERVICE_SECRET not configured');
    return res.status(500).json({ 
      success: false,
      error: 'Server configuration error' 
    });
  }

  if (!serviceToken || serviceToken !== expectedToken) {
    return res.status(403).json({ 
      success: false,
      error: 'Invalid service credentials' 
    });
  }

  console.log(`🔐 Service notification trigger: ${req.method} ${req.path}`);
  next();
};
