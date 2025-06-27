
export interface VoiceSample {
  id: string;
  userId: string;
  name: string;
  audioUrl: string;
  anthemUrl?: string;
  sampleUrl?: string;
  isPublic: boolean;
  characteristics?: VoiceCharacteristics;
  createdAt: Date;
}

export interface VoiceCharacteristics {
  pitchRange: [number, number];
  timbre: string;
  clarity: number;
  stability: number;
  naturalness?: number;
  genreSuitability?: {
    pop: number;
    rock: number;
    jazz: number;
    classical: number;
  };
  formants?: {
    f1: number;
    f2: number;
    f3: number;
  };
}

export interface VoiceCloneRequest {
  audio: Blob | string;
  name: string;
  makePublic: boolean;
  sampleText?: string;
}

export interface VoiceCloneResponse extends VoiceSample {
  requestId: string;
  processingTime?: string;
}
