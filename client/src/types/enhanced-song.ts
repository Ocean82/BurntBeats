import type { Song, WatermarkConfig, SongSection } from '@shared/schema';

// Complete type override for enhanced song functionality
export interface EnhancedSong {
  id: number;
  userId: string | null;
  title: string;
  lyrics: string | null;
  genre: string | null;
  vocalStyle: string | null;
  tempo: number | null;
  songLength: number | null;
  duration?: number | string | null;
  audioUrl?: string | null;
  voiceSampleId: number | null;
  generatedAudioPath: string | null;
  status: string | null;
  generationProgress: number | null;
  sections?: SongSection[] | any;
  settings: unknown;
  watermark?: WatermarkConfig | null;
  planRestricted: boolean | null;
  playCount: number | null;
  likes: number | null;
  rating: string | null;
  parentSongId: number | null;
  forkedFromId: number | null;
  isRemix: boolean | null;
  isDeleted: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export interface AudioPlayerSong extends EnhancedSong {
  duration: number;
  audioUrl: string;
  watermark: WatermarkConfig | null;
  sections: SongSection[];
}

export const normalizeSong = (song: Song): AudioPlayerSong => {
  // Safely parse duration
  let duration = 0;
  if (typeof song.duration === 'number') {
    duration = song.duration;
  } else if (typeof song.duration === 'string') {
    duration = parseFloat(song.duration) || 0;
  }

  // Get audio URL
  const audioUrl = (song as any).audioUrl || song.generatedAudioPath || '';

  // Parse watermark
  let watermark: WatermarkConfig | null = null;
  try {
    if (typeof song.watermark === 'object' && song.watermark) {
      watermark = song.watermark as WatermarkConfig;
    }
  } catch {
    watermark = null;
  }

  // Parse sections
  let sections: SongSection[] = [];
  try {
    if (Array.isArray(song.sections)) {
      sections = song.sections as SongSection[];
    } else if (typeof song.sections === 'object' && song.sections) {
      sections = Object.values(song.sections).filter(s => s && typeof s === 'object') as SongSection[];
    }
  } catch {
    sections = [];
  }

  return {
    ...song,
    duration,
    audioUrl,
    watermark,
    sections
  };
};