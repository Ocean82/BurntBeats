
import { Request, Response, Router } from 'express';
import { db } from '../db';
import { licenseAcknowledgments } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const acknowledgeSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  trackId: z.string().min(1, 'Track ID is required'), 
  timestamp: z.string().datetime('Invalid timestamp format'),
  purchaseId: z.string().optional()
});

export class LicenseAPI {
  static async acknowledgeLicense(req: Request, res: Response) {
    try {
      const validation = acknowledgeSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: validation.error.errors
        });
      }

      const { userId, trackId, timestamp, purchaseId } = validation.data;

      // Check if already acknowledged
      const existing = await db
        .select()
        .from(licenseAcknowledgments)
        .where(
          and(
            eq(licenseAcknowledgments.userId, userId),
            eq(licenseAcknowledgments.trackId, trackId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return res.status(200).json({ 
          message: 'License already acknowledged',
          entry: existing[0]
        });
      }

      // Create new acknowledgment
      const [entry] = await db
        .insert(licenseAcknowledgments)
        .values({
          userId,
          trackId,
          acceptedAt: new Date(timestamp),
          purchaseId: purchaseId || null
        })
        .returning();

      console.log(`📄 License acknowledged: User ${userId} for track ${trackId}`);

      res.status(200).json({ 
        message: 'License acknowledged successfully',
        entry 
      });

    } catch (error) {
      console.error('License acknowledgment error:', error);
      res.status(500).json({ 
        message: 'Server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getLicenseStatus(req: Request, res: Response) {
    try {
      const { userId, trackId } = req.params;

      const acknowledgment = await db
        .select()
        .from(licenseAcknowledgments)
        .where(
          and(
            eq(licenseAcknowledgments.userId, userId),
            eq(licenseAcknowledgments.trackId, trackId)
          )
        )
        .limit(1);

      res.json({
        acknowledged: acknowledgment.length > 0,
        entry: acknowledgment[0] || null
      });

    } catch (error) {
      console.error('License status check error:', error);
      res.status(500).json({ error: 'Failed to check license status' });
    }
  }
}

// Routes
router.post('/acknowledge', LicenseAPI.acknowledgeLicense);
router.get('/status/:userId/:trackId', LicenseAPI.getLicenseStatus);

export default router;
