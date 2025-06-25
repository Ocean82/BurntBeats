
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

interface PDFLicenseOptions {
  songTitle: string;
  userId: string;
  licenseId?: string;
  outputDir?: string;
  issuedAt?: Date;
  tier?: 'base' | 'top';
  userEmail?: string;
}

export function generatePDFLicense(options: PDFLicenseOptions): string {
  const {
    songTitle,
    userId,
    licenseId = `BBX-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now()}`,
    outputDir = path.join(process.cwd(), 'uploads/licenses'),
    issuedAt = new Date(),
    tier = 'base',
    userEmail = 'user@example.com'
  } = options;

  const dateStr = issuedAt.toLocaleDateString();
  const filename = `${songTitle.replace(/\s+/g, '_')}_license_${licenseId}.pdf`;
  const filePath = path.join(outputDir, filename);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });

  // Pipe the PDF to a file
  doc.pipe(fs.createWriteStream(filePath));

  // Header
  doc.fontSize(20)
     .fillColor('#FF6B35')
     .text('BURNT BEATS', { align: 'center' })
     .fontSize(16)
     .fillColor('#333')
     .text('Commercial Music License', { align: 'center' })
     .moveDown(2);

  // License box
  doc.rect(50, doc.y, doc.page.width - 100, 80)
     .stroke('#FF6B35')
     .fontSize(12)
     .fillColor('#333');

  const boxY = doc.y + 10;
  doc.text(`License ID: ${licenseId}`, 60, boxY)
     .text(`Issued: ${dateStr}`, 60, boxY + 20)
     .text(`Track: "${songTitle}"`, 60, boxY + 40)
     .text(`Licensee: ${userEmail}`, 60, boxY + 60);

  doc.y += 100;

  // License type badge
  const licenseType = tier === 'top' ? 'COMMERCIAL PREMIUM' : 'COMMERCIAL STANDARD';
  doc.rect(50, doc.y, 200, 30)
     .fill(tier === 'top' ? '#8B5CF6' : '#3B82F6')
     .fontSize(12)
     .fillColor('white')
     .text(licenseType, 60, doc.y + 10);

  doc.fillColor('#333').moveDown(2);

  // Grant of Rights
  doc.fontSize(14)
     .fillColor('#FF6B35')
     .text('GRANT OF RIGHTS', { underline: true })
     .fontSize(11)
     .fillColor('#333')
     .moveDown(0.5);

  const rights = [
    '• Streaming platforms (YouTube, Spotify, Apple Music, TikTok, etc.)',
    '• Digital distribution and sale (DistroKid, CD Baby, Bandcamp, etc.)',
    '• Commercial projects (podcasts, advertisements, games, film, TV, etc.)',
    '• Live performances and public exhibitions',
    '• Synchronization with visual media'
  ];

  if (tier === 'top') {
    rights.push('• Multitrack stems for professional mixing');
    rights.push('• Enhanced commercial distribution rights');
  }

  rights.forEach(right => {
    doc.text(right, { continued: false });
  });

  doc.moveDown(1);

  // Licensee Rights
  doc.fontSize(14)
     .fillColor('#FF6B35')
     .text('LICENSEE RIGHTS', { underline: true })
     .fontSize(11)
     .fillColor('#333')
     .moveDown(0.5);

  const licenseeRights = [
    '• Modify, remix, edit, or adapt the track as desired',
    '• Create derivative works based on the original composition',
    '• Use the track in monetized content and commercial projects',
    '• Distribute the track through any legal channels',
    '• Perform the track publicly with proper attribution'
  ];

  licenseeRights.forEach(right => {
    doc.text(right);
  });

  doc.moveDown(1);

  // Restrictions
  doc.fontSize(14)
     .fillColor('#FF6B35')
     .text('RESTRICTIONS', { underline: true })
     .fontSize(11)
     .fillColor('#333')
     .moveDown(0.5);

  const restrictions = [
    '• Cannot republish or redistribute the raw vocal synthesis engine',
    '• Cannot share access to Burnt Beats\' proprietary AI models or tools',
    '• Cannot use in unlawful, defamatory, hateful, or discriminatory content',
    '• Cannot claim ownership of the underlying AI technology'
  ];

  restrictions.forEach(restriction => {
    doc.text(restriction);
  });

  doc.moveDown(1);

  // Ownership clause
  doc.fontSize(14)
     .fillColor('#FF6B35')
     .text('OWNERSHIP', { underline: true })
     .fontSize(11)
     .fillColor('#333')
     .moveDown(0.5)
     .text('The Licensee owns full rights to the rendered audio output and any derivative works created from it. All software, AI models, and infrastructure used to generate the track remain the intellectual property of Burnt Beats.');

  doc.moveDown(1);

  // Verification
  doc.fontSize(14)
     .fillColor('#FF6B35')
     .text('VERIFICATION', { underline: true })
     .fontSize(11)
     .fillColor('#333')
     .moveDown(0.5)
     .text(`This license can be verified at: https://burntbeats.app/verify/${licenseId}`);

  // Footer
  doc.moveDown(2)
     .fontSize(10)
     .fillColor('#666')
     .text('Burnt Beats', { align: 'center' })
     .text('https://burntbeats.app | support@burntbeats.app', { align: 'center' })
     .text(`© ${issuedAt.getFullYear()} Burnt Beats. All rights reserved.`, { align: 'center' });

  // Add a subtle watermark
  doc.opacity(0.1)
     .fontSize(60)
     .fillColor('#FF6B35')
     .text('BURNT BEATS', 0, 400, {
       align: 'center',
       angle: -45
     });

  doc.end();

  console.log(`📄 PDF License created at: ${filePath}`);
  return filePath;
}
