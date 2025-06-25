
import fs from 'fs';
import path from 'path';

interface LicenseOptions {
  songTitle: string;
  userId: string;
  licenseId?: string;
  outputDir?: string;
  issuedAt?: Date;
  tier?: 'base' | 'top';
  userEmail?: string;
  artistName?: string;
  beatId?: string;
}

interface BeatPopularityStats {
  beatId: string;
  songTitle: string;
  totalLicenses: number;
  tierBreakdown: {
    bonus: number;
    base: number;
    top: number;
  };
  totalRevenue: number;
  firstLicensed: string;
  lastLicensed: string;
  popularityScore: number;
}

export function generateLicense(options: LicenseOptions): string {
  const {
    songTitle,
    userId,
    licenseId = `BBX-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now()}`,
    outputDir = path.join(process.cwd(), 'uploads/licenses'),
    issuedAt = new Date(),
    tier = 'base',
    userEmail = 'user@example.com',
    artistName = 'Artist',
    beatId = Math.random().toString(36).slice(2, 8).toUpperCase()
  } = options;

  const dateStr = issuedAt.toISOString().split('T')[0];
  const filename = `${songTitle.replace(/\s+/g, '_')}_license_${licenseId}.txt`;
  const filePath = path.join(outputDir, filename);

  const licenseType = tier === 'top' ? 'Commercial Premium' : 'Commercial Standard';
  const additionalRights = tier === 'top' ? `
- Multitrack stems included for professional mixing
- 24-bit/96kHz studio quality master
- Enhanced commercial distribution rights
- Priority support for licensing questions` : `
- High-quality MP3 320kbps format
- Standard commercial distribution rights`;

  const text = `
BURNT BEATS COMMERCIAL MUSIC LICENSE
${licenseType} License

=====================================
LICENSE CERTIFICATE
=====================================
Issued Date: ${dateStr}
Track Title: "${songTitle}"
Artist Name: ${artistName}
Beat ID: ${beatId}
Licensee ID: ${userId}
Licensee Email: ${userEmail}
License ID: ${licenseId}
Certificate Authority: Burnt Beats Music Platform
License Type: ${licenseType}

=====================================
GRANT OF RIGHTS
=====================================
Burnt Beats hereby grants the Licensee a non-exclusive, perpetual, worldwide license to use the above-named musical composition and sound recording for:

• Streaming platforms (YouTube, Spotify, Apple Music, TikTok, etc.)
• Digital distribution and sale (DistroKid, CD Baby, Bandcamp, etc.)
• Commercial projects (podcasts, advertisements, games, film, television, etc.)
• Live performances and public exhibitions
• Synchronization with visual media${additionalRights}

=====================================
LICENSEE RIGHTS
=====================================
The Licensee may:
- Modify, remix, edit, or adapt the track as desired
- Create derivative works based on the original composition
- Use the track in monetized content and commercial projects
- Distribute the track through any legal channels
- Perform the track publicly with proper attribution

=====================================
OWNERSHIP AND RESTRICTIONS
=====================================
The Licensee owns full rights to the rendered audio output and any derivative works created from it.

All software, AI models, synthesis tools, and infrastructure used to generate the track remain the intellectual property of Burnt Beats.

This license does NOT permit:
- Republishing or redistributing the raw vocal synthesis engine
- Sharing access to Burnt Beats' proprietary AI models or tools
- Using the track in unlawful, defamatory, hateful, or discriminatory content
- Claiming ownership of the underlying AI technology or generation process

=====================================
ATTRIBUTION
=====================================
While not required, attribution as "Generated with Burnt Beats" is appreciated for promotional purposes.

=====================================
WARRANTY AND LIABILITY
=====================================
This track is provided "as is" without warranty. Burnt Beats shall not be liable for any damages arising from the use of this licensed material.

=====================================
VERIFICATION
=====================================
This license can be verified at: https://burntbeats.app/verify/${licenseId}

This document certifies legal commercial usage rights for the audio asset named above.

Burnt Beats
Website: https://burntbeats.app
Email: support@burntbeats.app
License Generated: ${issuedAt.toISOString()}

© ${issuedAt.getFullYear()} Burnt Beats. All rights reserved.
`;

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(filePath, text.trim());
  console.log(`📄 License file created at: ${filePath}`);

  // Track beat popularity
  trackBeatPopularity(beatId, songTitle, tier, userEmail);

  return filePath;
}

// Beat popularity tracking system
export async function trackBeatPopularity(
  beatId: string, 
  songTitle: string, 
  tier: 'bonus' | 'base' | 'top', 
  userEmail: string
): Promise<void> {
  try {
    const statsDir = path.join(process.cwd(), 'uploads/beat-stats');
    const statsFile = path.join(statsDir, `${beatId}_stats.json`);
    
    // Ensure directory exists
    if (!fs.existsSync(statsDir)) {
      fs.mkdirSync(statsDir, { recursive: true });
    }

    // Pricing for each tier
    const tierPricing = {
      bonus: 2.99,
      base: 4.99,
      top: 9.99
    };

    let stats: BeatPopularityStats;

    // Load existing stats or create new
    if (fs.existsSync(statsFile)) {
      const existingStats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
      stats = existingStats;
      
      // Update existing stats
      stats.totalLicenses += 1;
      stats.tierBreakdown[tier] += 1;
      stats.totalRevenue += tierPricing[tier];
      stats.lastLicensed = new Date().toISOString();
      
      // Calculate popularity score (weighted by tier)
      const weights = { bonus: 1, base: 2, top: 3 };
      stats.popularityScore = 
        (stats.tierBreakdown.bonus * weights.bonus) +
        (stats.tierBreakdown.base * weights.base) +
        (stats.tierBreakdown.top * weights.top);
        
    } else {
      // Create new stats
      stats = {
        beatId,
        songTitle,
        totalLicenses: 1,
        tierBreakdown: {
          bonus: tier === 'bonus' ? 1 : 0,
          base: tier === 'base' ? 1 : 0,
          top: tier === 'top' ? 1 : 0
        },
        totalRevenue: tierPricing[tier],
        firstLicensed: new Date().toISOString(),
        lastLicensed: new Date().toISOString(),
        popularityScore: tier === 'bonus' ? 1 : tier === 'base' ? 2 : 3
      };
    }

    // Save updated stats
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
    
    console.log(`📊 Beat popularity updated: ${beatId} - ${stats.totalLicenses} licenses, $${stats.totalRevenue.toFixed(2)} revenue`);
    
  } catch (error) {
    console.error('Failed to track beat popularity:', error);
  }
}

// Get beat popularity stats
export function getBeatPopularityStats(beatId: string): BeatPopularityStats | null {
  try {
    const statsFile = path.join(process.cwd(), 'uploads/beat-stats', `${beatId}_stats.json`);
    
    if (!fs.existsSync(statsFile)) {
      return null;
    }
    
    return JSON.parse(fs.readFileSync(statsFile, 'utf8'));
  } catch (error) {
    console.error('Failed to load beat popularity stats:', error);
    return null;
  }
}

// Get top performing beats
export function getTopPerformingBeats(limit: number = 10): BeatPopularityStats[] {
  try {
    const statsDir = path.join(process.cwd(), 'uploads/beat-stats');
    
    if (!fs.existsSync(statsDir)) {
      return [];
    }
    
    const statFiles = fs.readdirSync(statsDir)
      .filter(file => file.endsWith('_stats.json'));
    
    const allStats: BeatPopularityStats[] = statFiles.map(file => {
      const content = fs.readFileSync(path.join(statsDir, file), 'utf8');
      return JSON.parse(content);
    });
    
    // Sort by popularity score (descending)
    return allStats
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limit);
      
  } catch (error) {
    console.error('Failed to get top performing beats:', error);
    return [];
  }
}

export function getLicenseById(licenseId: string): string | null {
  const licenseDir = path.join(process.cwd(), 'uploads/licenses');
  
  if (!fs.existsSync(licenseDir)) {
    return null;
  }

  const files = fs.readdirSync(licenseDir);
  const licenseFile = files.find(file => file.includes(licenseId));
  
  if (!licenseFile) {
    return null;
  }

  return path.join(licenseDir, licenseFile);
}
