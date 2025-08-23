/**
 * Security Middleware for AI2 Enterprise Platform
 * Implements comprehensive security measures including authentication,
 * authorization, input validation, and rate limiting.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import Joi from 'joi';
import crypto from 'crypto';

// Types
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId?: string;
  };
}

interface SecurityConfig {
  jwtSecret: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  enableCSRF: boolean;
  enableCORS: boolean;
}

// JWT Authentication Middleware
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access token required',
      code: 'MISSING_TOKEN'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId
    };
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Role-based Authorization Middleware
export const authorize = (requiredRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
      return;
    }

    if (!requiredRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: requiredRoles,
        current: req.user.role
      });
      return;
    }

    next();
  };
};

// Input Validation Middleware
export const validateInput = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validationErrors
      });
      return;
    }

    req.body = value;
    next();
  };
};

// Rate Limiting Middleware
export const createRateLimit = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: options.message || 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: options.keyGenerator || ((req: Request) => req.ip || 'unknown'),
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Security Headers Middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
});

// API Key Validation Middleware
export const validateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({
      success: false,
      error: 'API key required',
      code: 'MISSING_API_KEY'
    });
    return;
  }

  // In production, validate against database
  // For now, check against environment variable
  if (!process.env.VALID_API_KEY || !crypto.timingSafeEqual(Buffer.from(apiKey), Buffer.from(process.env.VALID_API_KEY))) {
    res.status(403).json({
      success: false,
      error: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
    return;
  }

  next();
};

// Tenant Isolation Middleware
export const enforceTenantIsolation = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user?.tenantId) {
    res.status(403).json({
      success: false,
      error: 'Tenant context required',
      code: 'MISSING_TENANT_CONTEXT'
    });
    return;
  }

  // Add tenant filter to query params
  req.query.tenantId = req.user.tenantId;
  next();
};

// Request Sanitization Middleware
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Remove potentially dangerous characters
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};

// Audit Logging Middleware
export const auditLog = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log request
  console.log(JSON.stringify({
    type: 'audit_request',
    timestamp: new Date().toISOString(),
    userId: req.user?.id,
    tenantId: req.user?.tenantId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.headers['x-request-id'] || 'unknown'
  }));

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = Date.now() - startTime;
    
    console.log(JSON.stringify({
      type: 'audit_response',
      timestamp: new Date().toISOString(),
      userId: req.user?.id,
      tenantId: req.user?.tenantId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      success: res.statusCode < 400,
      requestId: req.headers['x-request-id'] || 'unknown'
    }));

    return originalJson.call(this, body);
  };

  next();
};

// Comprehensive Security Middleware Stack
export const securityMiddlewareStack = [
  securityHeaders,
  sanitizeInput,
  createRateLimit({ max: 1000, windowMs: 15 * 60 * 1000 }), // Global rate limit
  auditLog
];

// Export individual middleware for custom configurations
export type {
  AuthenticatedRequest,
  SecurityConfig
};