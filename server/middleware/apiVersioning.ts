/**
 * API Versioning Middleware
 * Handles multiple API versions with backward compatibility
 */

import { Request, Response, NextFunction } from 'express';
import { monitoring } from '../../client/lib/monitoring';

// Version configuration
export interface ApiVersion {
  version: string;
  deprecated?: boolean;
  deprecationDate?: Date;
  sunsetDate?: Date;
  changes?: string[];
}

export const API_VERSIONS: ApiVersion[] = [
  {
    version: 'v1',
    deprecated: true,
    deprecationDate: new Date('2024-01-01'),
    sunsetDate: new Date('2024-06-01'),
    changes: ['Initial API version'],
  },
  {
    version: 'v2',
    deprecated: false,
    changes: [
      'Added WebSocket support',
      'Enhanced security features',
      'Improved response format',
      'Added pagination metadata',
    ],
  },
  {
    version: 'v3',
    deprecated: false,
    changes: [
      'GraphQL support',
      'Batch operations',
      'Advanced filtering',
      'Real-time subscriptions',
    ],
  },
];

// Custom request interface with version
export interface VersionedRequest extends Request {
  apiVersion?: string;
  versionInfo?: ApiVersion;
}

/**
 * Extract API version from request
 */
function extractVersion(req: Request): string {
  // 1. Check URL path (e.g., /api/v2/users)
  const pathMatch = req.path.match(/\/api\/(v\d+)\//);
  if (pathMatch) {
    return pathMatch[1];
  }

  // 2. Check Accept header (e.g., Accept: application/vnd.api+json;version=2)
  const acceptHeader = req.get('Accept');
  if (acceptHeader) {
    const versionMatch = acceptHeader.match(/version=(\d+)/);
    if (versionMatch) {
      return `v${versionMatch[1]}`;
    }
  }

  // 3. Check custom header (e.g., X-API-Version: v2)
  const customHeader = req.get('X-API-Version');
  if (customHeader) {
    return customHeader;
  }

  // 4. Check query parameter (e.g., ?api_version=v2)
  const queryVersion = req.query.api_version || req.query.version;
  if (queryVersion) {
    return String(queryVersion);
  }

  // Default to latest stable version
  return 'v2';
}

/**
 * API Versioning Middleware
 */
export function apiVersioning() {
  return (req: VersionedRequest, res: Response, next: NextFunction) => {
    try {
      // Extract version from request
      const version = extractVersion(req);
      
      // Find version info
      const versionInfo = API_VERSIONS.find(v => v.version === version);
      
      if (!versionInfo) {
        return res.status(400).json({
          error: 'INVALID_API_VERSION',
          message: `API version ${version} is not supported`,
          supportedVersions: API_VERSIONS.map(v => v.version),
        });
      }

      // Check if version is sunset
      if (versionInfo.sunsetDate && new Date() > versionInfo.sunsetDate) {
        return res.status(410).json({
          error: 'API_VERSION_SUNSET',
          message: `API version ${version} has been sunset`,
          sunsetDate: versionInfo.sunsetDate,
          recommendedVersion: 'v3',
        });
      }

      // Add version to request
      req.apiVersion = version;
      req.versionInfo = versionInfo;

      // Add version headers to response
      res.setHeader('X-API-Version', version);
      
      // Add deprecation warning if applicable
      if (versionInfo.deprecated) {
        res.setHeader('X-API-Deprecated', 'true');
        if (versionInfo.sunsetDate) {
          res.setHeader('X-API-Sunset-Date', versionInfo.sunsetDate.toISOString());
        }
        res.setHeader('X-API-Recommended-Version', 'v3');
        
        // Add deprecation warning to response
        res.setHeader('Warning', `299 - "API version ${version} is deprecated and will be sunset on ${versionInfo.sunsetDate?.toISOString()}"`);
      }

      // Log version usage
      monitoring.info('API version request', {
        version,
        deprecated: versionInfo.deprecated,
        path: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      monitoring.error('API versioning error', error as Error);
      next(error);
    }
  };
}

/**
 * Version-specific route handler
 */
export function versionRoute(
  versions: Record<string, (req: Request, res: Response, next: NextFunction) => void>
) {
  return (req: VersionedRequest, res: Response, next: NextFunction) => {
    const version = req.apiVersion || 'v2';
    const handler = versions[version] || versions.default;

    if (!handler) {
      return res.status(501).json({
        error: 'NOT_IMPLEMENTED',
        message: `This endpoint is not implemented for API version ${version}`,
      });
    }

    handler(req, res, next);
  };
}

/**
 * Transform response based on API version
 */
export function transformResponse(version: string, data: any): any {
  switch (version) {
    case 'v1':
      // V1 format (legacy)
      return {
        success: true,
        data,
      };
    
    case 'v2':
      // V2 format (current)
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        version: 'v2',
      };
    
    case 'v3':
      // V3 format (latest)
      return {
        success: true,
        data,
        metadata: {
          timestamp: new Date().toISOString(),
          version: 'v3',
          requestId: generateRequestId(),
        },
      };
    
    default:
      return data;
  }
}

/**
 * Version-specific error transformer
 */
export function transformError(version: string, error: any): any {
  const baseError = {
    error: error.code || 'INTERNAL_ERROR',
    message: error.message || 'An error occurred',
  };

  switch (version) {
    case 'v1':
      return {
        success: false,
        error: baseError.message,
      };
    
    case 'v2':
      return {
        success: false,
        ...baseError,
        timestamp: new Date().toISOString(),
      };
    
    case 'v3':
      return {
        success: false,
        error: {
          code: baseError.error,
          message: baseError.message,
          details: error.details || {},
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: 'v3',
          requestId: generateRequestId(),
        },
      };
    
    default:
      return baseError;
  }
}

/**
 * Version compatibility checker
 */
export function checkCompatibility(
  requiredVersion: string,
  clientVersion: string
): boolean {
  const required = parseInt(requiredVersion.replace('v', ''));
  const client = parseInt(clientVersion.replace('v', ''));
  
  // Client version must be >= required version
  return client >= required;
}

/**
 * Feature flag based on version
 */
export function hasFeature(version: string, feature: string): boolean {
  const features: Record<string, string[]> = {
    v1: ['basic_auth', 'products', 'orders'],
    v2: ['basic_auth', 'products', 'orders', 'websocket', 'chat', 'notifications'],
    v3: ['basic_auth', 'products', 'orders', 'websocket', 'chat', 'notifications', 'graphql', 'batch', 'subscriptions'],
  };

  return features[version]?.includes(feature) || false;
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Version migration helper
 */
export class VersionMigrator {
  /**
   * Migrate request from v1 to v2
   */
  static migrateV1ToV2(data: any): any {
    // Add new required fields
    if (data.user) {
      data.user.preferredLanguage = data.user.language || 'en';
      delete data.user.language;
    }

    // Transform date formats
    if (data.created_at) {
      data.createdAt = data.created_at;
      delete data.created_at;
    }

    return data;
  }

  /**
   * Migrate request from v2 to v3
   */
  static migrateV2ToV3(data: any): any {
    // Add metadata structure
    if (!data.metadata) {
      data.metadata = {
        version: 'v3',
        migrated: true,
      };
    }

    // Transform nested structures
    if (data.user && !data.user.profile) {
      data.user.profile = {
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        avatar: data.user.profileImage,
      };
    }

    return data;
  }

  /**
   * Auto-migrate data to target version
   */
  static migrate(data: any, fromVersion: string, toVersion: string): any {
    let migrated = { ...data };

    // V1 -> V2
    if (fromVersion === 'v1' && toVersion !== 'v1') {
      migrated = this.migrateV1ToV2(migrated);
    }

    // V2 -> V3
    if ((fromVersion === 'v1' || fromVersion === 'v2') && toVersion === 'v3') {
      migrated = this.migrateV2ToV3(migrated);
    }

    return migrated;
  }
}

/**
 * API Documentation generator per version
 */
export function generateVersionDocs(version: string): any {
  const baseUrl = process.env.API_URL || 'https://api.medical-devices.com';
  
  return {
    version,
    baseUrl: `${baseUrl}/api/${version}`,
    deprecated: API_VERSIONS.find(v => v.version === version)?.deprecated || false,
    endpoints: getVersionEndpoints(version),
    changes: API_VERSIONS.find(v => v.version === version)?.changes || [],
    authentication: {
      type: 'Bearer',
      header: 'Authorization',
      format: 'Bearer {token}',
    },
    rateLimit: {
      requests: version === 'v1' ? 100 : version === 'v2' ? 500 : 1000,
      window: '1 hour',
    },
  };
}

/**
 * Get available endpoints for version
 */
function getVersionEndpoints(version: string): string[] {
  const endpoints: Record<string, string[]> = {
    v1: [
      'GET /users',
      'GET /products',
      'POST /orders',
    ],
    v2: [
      'GET /users',
      'GET /products',
      'POST /orders',
      'WS /chat',
      'GET /notifications',
    ],
    v3: [
      'GET /users',
      'GET /products',
      'POST /orders',
      'WS /chat',
      'GET /notifications',
      'POST /graphql',
      'POST /batch',
    ],
  };

  return endpoints[version] || [];
}

export default apiVersioning;