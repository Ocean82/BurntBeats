
import { SongSectionsArraySchema, type SongSection } from '../validation/schemas';

export class SectionValidator {
  static validateSections(sections: unknown): SongSection[] {
    try {
      return SongSectionsArraySchema.parse(sections);
    } catch (error) {
      throw new Error(`Invalid song sections: ${error.message}`);
    }
  }

  static ensureNonOverlapping(sections: SongSection[]): boolean {
    const sorted = [...sections].sort((a, b) => a.start - b.start);
    
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].end > sorted[i + 1].start) {
        return false;
      }
    }
    return true;
  }

  static calculateTotalDuration(sections: SongSection[]): number {
    if (sections.length === 0) return 0;
    const sorted = [...sections].sort((a, b) => a.start - b.start);
    return Math.max(...sorted.map(s => s.end));
  }

  static generateSectionId(): string {
    return `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static createDefaultSections(duration: number): SongSection[] {
    const quarter = duration / 4;
    
    return [
      {
        id: SectionValidator.generateSectionId(),
        label: 'Intro',
        start: 0,
        end: quarter,
      },
      {
        id: SectionValidator.generateSectionId(),
        label: 'Verse',
        start: quarter,
        end: quarter * 2,
      },
      {
        id: SectionValidator.generateSectionId(),
        label: 'Chorus',
        start: quarter * 2,
        end: quarter * 3,
      },
      {
        id: SectionValidator.generateSectionId(),
        label: 'Outro',
        start: quarter * 3,
        end: duration,
      },
    ] as SongSection[];
  }
}
