import { Request, Response } from 'express';
import { db } from '../db.js';
import { license_acknowledgments, songs } from '../db/schema.js';
import { createId } from '@paralleldrive/cuid2';
import { eq, and } from 'drizzle-orm';

export async function createLicenseAcknowledgment(req: Request, res: Response) {
  try {
    const { song_id, license_type, acknowledgment_text } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    if (!song_id || !license_type || !acknowledgment_text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: song_id, license_type, acknowledgment_text' 
      });
    }

    // Verify the song belongs to the user
    const song = await db.select().from(songs).where(
      and(eq(songs.id, song_id), eq(songs.user_id, user_id))
    ).limit(1);

    if (song.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Song not found or access denied' 
      });
    }

    // Check if acknowledgment already exists
    const existingAcknowledgment = await db.select().from(license_acknowledgments).where(
      and(
        eq(license_acknowledgments.song_id, song_id),
        eq(license_acknowledgments.user_id, user_id)
      )
    ).limit(1);

    if (existingAcknowledgment.length > 0) {
      return res.status(200).json({
        success: true,
        data: existingAcknowledgment[0],
        message: 'License acknowledgment already exists'
      });
    }

    // Create new acknowledgment
    const newAcknowledgment = await db.insert(license_acknowledgments).values({
      id: createId(),
      song_id,
      user_id,
      license_type,
      acknowledgment_text,
      created_at: new Date()
    }).returning();

    res.status(201).json({
      success: true,
      data: newAcknowledgment[0],
      message: 'License acknowledgment created successfully'
    });

  } catch (error) {
    console.error('Error creating license acknowledgment:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create license acknowledgment' 
    });
  }
}

export async function getLicenseAcknowledgment(req: Request, res: Response) {
  try {
    const { songId } = req.params;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    const acknowledgment = await db.select().from(license_acknowledgments).where(
      and(
        eq(license_acknowledgments.song_id, songId),
        eq(license_acknowledgments.user_id, user_id)
      )
    ).limit(1);

    if (acknowledgment.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'License acknowledgment not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: acknowledgment[0]
    });

  } catch (error) {
    console.error('Error retrieving license acknowledgment:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve license acknowledgment' 
    });
  }
}