import { Router } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';
import EnvConfigService from '../../services/env-config.service';

// Define types from schema
type UserType = 'HEALTHCARE_PROVIDER' | 'EQUIPMENT_SUPPLIER' | 'MAINTENANCE_ENGINEER' | 'CUSTOMER_SERVICE' | 'ADMIN' | 'INDIVIDUAL_CUSTOMER';

const router = Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireRole(['ADMIN'])); // Use string literal instead of enum

/**
 * GET /api/admin/env-config
 * Get all environment variables grouped by category
 */
router.get('/', async (req, res) => {
  try {
    const includeValues = req.query.includeValues === 'true';
    const variables = await EnvConfigService.getAllVariables(includeValues);
    
    res.json({
      success: true,
      variables
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/admin/env-config/check
 * Check if initial configuration is needed
 */
router.get('/check', async (req, res) => {
  try {
    const needsConfiguration = await EnvConfigService.needsInitialConfiguration();
    
    res.json({
      success: true,
      needsConfiguration
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/admin/env-config/wizard
 * Get configuration wizard data
 */
router.get('/wizard', async (req, res) => {
  try {
    const wizardData = await EnvConfigService.getConfigurationWizard();
    
    res.json({
      success: true,
      ...wizardData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/admin/env-config/update
 * Update an environment variable
 */
router.post('/update', async (req, res) => {
  try {
    const { key, value } = req.body;
    const userId = req.user!.id;
    
    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Key and value are required'
      });
    }
    
    await EnvConfigService.updateVariable(key, value, userId);
    
    res.json({
      success: true,
      message: 'Environment variable updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /api/admin/env-config/:key
 * Delete an environment variable
 */
router.delete('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const userId = req.user!.id;
    
    await EnvConfigService.deleteVariable(key, userId);
    
    res.json({
      success: true,
      message: 'Environment variable deleted successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/admin/env-config/snapshots
 * Get all configuration snapshots
 */
router.get('/snapshots', async (req, res) => {
  try {
    const { prisma } = require('../../config/database');
    const snapshots = await prisma.envSnapshot.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      snapshots
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/admin/env-config/snapshot
 * Create a new configuration snapshot
 */
router.post('/snapshot', async (req, res) => {
  try {
    const { description } = req.body;
    const userId = req.user!.id;
    
    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }
    
    const snapshot = await EnvConfigService.createSnapshot(description, userId);
    
    res.json({
      success: true,
      message: 'Snapshot created successfully',
      snapshot
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/admin/env-config/snapshot/:id/restore
 * Restore a configuration snapshot
 */
router.post('/snapshot/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    
    await EnvConfigService.restoreSnapshot(id, userId);
    
    res.json({
      success: true,
      message: 'Snapshot restored successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/admin/env-config/test/:provider
 * Test a provider configuration
 */
router.post('/test/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    
    const result = await EnvConfigService.testProvider(provider);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/admin/env-config/redeploy
 * Trigger Vercel redeployment
 */
router.post('/redeploy', async (req, res) => {
  try {
    const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
    const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
    
    if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
      return res.status(400).json({
        success: false,
        message: 'Vercel integration not configured'
      });
    }
    
    const axios = require('axios');
    const url = 'https://api.vercel.com/v13/deployments';
    
    await axios.post(url, {
      name: VERCEL_PROJECT_ID,
      project: VERCEL_PROJECT_ID,
      target: 'production'
    }, {
      headers: {
        Authorization: `Bearer ${VERCEL_API_TOKEN}`,
        ...(process.env.VERCEL_TEAM_ID && { 'Vercel-Team-Id': process.env.VERCEL_TEAM_ID })
      }
    });
    
    res.json({
      success: true,
      message: 'Redeployment triggered successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/admin/env-config/export
 * Export current configuration
 */
router.get('/export', async (req, res) => {
  try {
    const variables = await EnvConfigService.getAllVariables(true);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="env-config-${Date.now()}.json"`);
    
    res.json({
      exportedAt: new Date().toISOString(),
      variables
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/admin/env-config/import
 * Import configuration from file
 */
router.post('/import', async (req, res) => {
  try {
    const { variables } = req.body;
    const userId = req.user!.id;
    
    if (!variables || typeof variables !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration data'
      });
    }
    
    let imported = 0;
    let failed = 0;
    const errors: any[] = [];
    
    for (const [category, vars] of Object.entries(variables)) {
      if (Array.isArray(vars)) {
        for (const variable of vars as any[]) {
          try {
            await EnvConfigService.updateVariable(variable.key, variable.value, userId);
            imported++;
          } catch (error: any) {
            failed++;
            errors.push({
              key: variable.key,
              error: error.message
            });
          }
        }
      }
    }
    
    res.json({
      success: true,
      message: `Imported ${imported} variables, ${failed} failed`,
      imported,
      failed,
      errors
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;