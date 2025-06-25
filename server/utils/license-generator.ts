
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
}

export function generateLicense(options: LicenseOptions): string {
  const {
    songTitle,
    userId,
    licenseId = `BBX-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now()}`,
    outputDir = path.join(process.cwd(), 'uploads/licenses'),
    issuedAt = new Date(),
    tier = 'base',
    userEmail = 'user@example.com'
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
LICENSE DETAILS
=====================================
Issued Date: ${dateStr}
Track Title: "${songTitle}"
Licensee ID: ${userId}
Licensee Email: ${userEmail}
License ID: ${licenseId}
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

  return filePath;
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
