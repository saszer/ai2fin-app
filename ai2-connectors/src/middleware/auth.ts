// --- 📦 CONNECTORS SERVICE AUTHENTICATION ---
// embracingearth.space - Enterprise Security

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

/**
 * JWT authentication for connector endpoints
 * NO HARDCODED SECRETS
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required for connectors' 
    });
  }

  // CRITICAL: No fallback secrets
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('CRITICAL: JWT_SECRET not configured for connectors service');
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

    // Audit log for connector access
    console.log(`🔌 Connector Access: ${req.user.email} - ${req.method} ${req.path}`);
    
    next();
  } catch (error: any) {
    // Enhanced error logging for debugging JWT issues
    const errorDetails: any = {
      message: error.message,
      name: error.name,
      path: req.path,
      method: req.method,
      hasSecret: !!secret,
      secretLength: secret ? secret.length : 0
    };
    
    // Log specific JWT error types for easier debugging
    if (error.name === 'JsonWebTokenError') {
      errorDetails.jwtError = 'Token format invalid or secret mismatch';
      errorDetails.diagnosis = 'JWT_SECRET likely mismatched between services';
    } else if (error.name === 'TokenExpiredError') {
      errorDetails.jwtError = 'Token expired';
      errorDetails.diagnosis = 'Token has expired - user needs to re-authenticate';
    } else if (error.name === 'NotBeforeError') {
      errorDetails.jwtError = 'Token not active yet';
      errorDetails.diagnosis = 'Token is not yet valid';
    } else if (error.message?.includes('invalid signature')) {
      errorDetails.jwtError = 'Invalid signature - JWT_SECRET mismatch';
      errorDetails.diagnosis = 'CRITICAL: JWT_SECRET must match between core app and connectors service';
    }
    
    // Always log full error details for debugging
    console.error('Connector auth failed:', JSON.stringify(errorDetails, null, 2));
    console.error('Full error:', error);
    
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid or expired token',
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    });
  }
};

/**
 * Service-to-service authentication
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

  console.log(`🔐 Service call to connectors: ${req.method} ${req.path}`);
  next();
};









