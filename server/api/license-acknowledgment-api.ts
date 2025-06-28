import { Request, Response } from 'express';
import { db } from '../db';
import { licenseAcknowledgments } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { Router } from 'express';

const router = Router();

export class LicenseAcknowledgmentAPI {
  // POST /api/license-acknowledgment
  static async acknowledgeLicense(req: Request, res: Response) {
    try {
      const { userId, trackId, timestamp, purchaseId } = req.body;

      if (!userId || !trackId || !timestamp) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          message: 'userId, trackId, and timestamp are required' 
        });
      }

      // Check if acknowledgment already exists
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
          acknowledgment: existing[0]
        });
      }

      // Create new acknowledgment
      const [newAcknowledgment] = await db
        .insert(licenseAcknowledgments)
        .values({
          userId,
          trackId,
          acceptedAt: new Date(timestamp),
          purchaseId: purchaseId || null
        })
        .returning();

      console.log(`🔥 License acknowledged - User: ${userId}, Track: ${trackId}`);

      res.status(201).json({
        success: true,
        message: 'License acknowledgment recorded',
        acknowledgment: newAcknowledgment
      });

    } catch (error) {
      console.error('License acknowledgment error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to record license acknowledgment'
      });
    }
  }

  // GET /api/license-acknowledgment/:userId/:trackId
  static async checkAcknowledgment(req: Request, res: Response) {
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
        acknowledgment: acknowledgment[0] || null
      });

    } catch (error) {
      console.error('Check acknowledgment error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to check license acknowledgment'
      });
    }
  }

  // GET /api/license-acknowledgment/user/:userId
  static async getUserAcknowledgments(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const acknowledgments = await db
        .select()
        .from(licenseAcknowledgments)
        .where(eq(licenseAcknowledgments.userId, userId))
        .orderBy(licenseAcknowledgments.acceptedAt);

      res.json({
        success: true,
        acknowledgments,
        count: acknowledgments.length
      });

    } catch (error) {
      console.error('Get user acknowledgments error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve user acknowledgments'
      });
    }
  }

  // PUT /api/license-acknowledgment/link-purchase
  static async linkPurchase(req: Request, res: Response) {
    try {
      const { userId, trackId, purchaseId } = req.body;

      if (!userId || !trackId || !purchaseId) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'userId, trackId, and purchaseId are required'
        });
      }

      const [updated] = await db
        .update(licenseAcknowledgments)
        .set({ 
          purchaseId,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(licenseAcknowledgments.userId, userId),
            eq(licenseAcknowledgments.trackId, trackId)
          )
        )
        .returning();

      if (!updated) {
        return res.status(404).json({
          error: 'Acknowledgment not found',
          message: 'No license acknowledgment found for this user and track'
        });
      }

      res.json({
        success: true,
        message: 'Purchase linked to license acknowledgment',
        acknowledgment: updated
      });

    } catch (error) {
      console.error('Link purchase error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to link purchase to acknowledgment'
      });
    }
  }
}

// Routes
router.post('/', LicenseAcknowledgmentAPI.acknowledgeLicense);
router.get('/:userId/:trackId', LicenseAcknowledgmentAPI.checkAcknowledgment);
router.get('/user/:userId', LicenseAcknowledgmentAPI.getUserAcknowledgments);
router.put('/link-purchase', LicenseAcknowledgmentAPI.linkPurchase);

export { LicenseAcknowledgmentAPI };
export { router };