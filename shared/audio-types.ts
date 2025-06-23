// Audio Player Types and Interfaces
export interface AudioMetadata {
  title: string;
  artist?: string;
  album?: string;
  duration: number;
  format: 'wav' | 'mp3' | 'flac';
  sampleRate: number;
  bitRate: number;
  channels: number;
  fileSize: number;
}

export interface AudioSection {
  id: string;
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'instrumental';
  startTime: number;
  endTime: number;
  lyrics?: string;
  description?: string;
}

export interface AudioPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isLoading: boolean;
  isBuffering: boolean;
  error?: string;
}

export interface AudioPlayerConfig {
  autoPlay?: boolean;
  loop?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  crossOrigin?: 'anonymous' | 'use-credentials';
  volume?: number;
  playbackRate?: number;
}

export interface WaveformData {
  peaks: number[];
  length: number;
  samplesPerPixel: number;
}

export interface AudioAnalytics {
  playCount: number;
  totalPlayTime: number;
  completionRate: number;
  skipRate: number;
  averageListenDuration: number;
  mostPlayedSection?: string;
}

// API Response Types
export interface AudioStreamResponse {
  url: string;
  metadata: AudioMetadata;
  waveform?: WaveformData;
  sections?: AudioSection[];
}

export interface AudioProcessingStatus {
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  stage: string;
  estimatedTime?: number;
}