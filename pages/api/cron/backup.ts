/**
 * Automated Backup Cron Job
 * Runs daily at 2 AM to backup database and files
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';
import { monitoring } from '../../../client/lib/monitoring';

const execAsync = promisify(exec);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify cron secret
  const cronSecret = req.headers['x-cron-secret'];
  if (cronSecret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only allow Vercel Cron or manual trigger in development
  if (process.env.NODE_ENV === 'production' && !req.headers['x-vercel-cron']) {
    return res.status(401).json({ error: 'Only Vercel Cron can trigger this endpoint' });
  }

  try {
    monitoring.info('Starting automated backup job');

    // Run backup script
    const { stdout, stderr } = await execAsync('./scripts/backup-automation.sh backup full');

    if (stderr) {
      monitoring.error('Backup job stderr output', { stderr });
    }

    monitoring.info('Backup job completed successfully', { stdout });

    // Send notification
    await sendBackupNotification('success', stdout);

    res.status(200).json({
      success: true,
      message: 'Backup completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    monitoring.error('Backup job failed', error as Error);

    // Send failure notification
    await sendBackupNotification('failure', (error as Error).message);

    res.status(500).json({
      success: false,
      error: 'Backup failed',
      message: (error as Error).message,
    });
  }
}

async function sendBackupNotification(status: 'success' | 'failure', details: string) {
  // Send to Slack
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Backup ${status === 'success' ? '✅ Successful' : '❌ Failed'}`,
          attachments: [{
            color: status === 'success' ? 'good' : 'danger',
            text: details.substring(0, 500),
            footer: 'Medical Devices Backup System',
            ts: Math.floor(Date.now() / 1000),
          }],
        }),
      });
    } catch (error) {
      monitoring.error('Failed to send Slack notification', error as Error);
    }
  }

  // Log to monitoring
  if (status === 'success') {
    monitoring.info('Backup notification sent', { status, details });
  } else {
    monitoring.error('Backup failure notification sent', new Error(details));
  }
}