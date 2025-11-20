// --- 📦 INPUT VALIDATION MIDDLEWARE ---
// embracingearth.space - Request validation and sanitization
// Ensures all inputs are validated and sanitized before processing

import { Request, Response, NextFunction } from 'express';
import { ConnectorCredentials } from '../types/connector';

/**
 * Validate request body structure
 */
export function validateRequest(requiredFields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields: string[] = [];
    
    for (const field of requiredFields) {
      if (!(field in req.body) || req.body[field] === undefined || req.body[field] === null) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    next();
  };
}

/**
 * Validate credentials structure based on connector metadata
 */
export function validateCredentials(credentialFields: Array<{ name: string; required: boolean; type: string }>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const credentials: ConnectorCredentials = req.body.credentials || {};
    const errors: string[] = [];
    
    for (const field of credentialFields) {
      if (field.required && (!(field.name in credentials) || !credentials[field.name])) {
        errors.push(`${field.name} is required`);
      }
      
      // Type validation
      if (credentials[field.name] !== undefined && credentials[field.name] !== null) {
        const value = credentials[field.name];
        const valueType = typeof value;
        
        if (field.type === 'number' && valueType !== 'number' && isNaN(Number(value))) {
          errors.push(`${field.name} must be a number`);
        } else if (field.type === 'email' && valueType === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(`${field.name} must be a valid email address`);
        } else if (field.type === 'url' && valueType === 'string' && !/^https?:\/\/.+/.test(value)) {
          errors.push(`${field.name} must be a valid URL`);
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid credentials',
        details: errors
      });
    }
    
    next();
  };
}

/**
 * Sanitize string inputs to prevent XSS
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous characters
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
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
  
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query) as any;
  }
  
  next();
}

/**
 * Validate date format
 */
export function validateDate(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}



