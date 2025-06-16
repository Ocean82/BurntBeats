export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function calculateEstimatedDuration(wordCount: number): number {
  // Rough estimate: 3 seconds per word for lyrics
  return Math.max(180, wordCount * 3);
}

export function validateAudioFile(file: File): boolean {
  const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg'];
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  return allowedTypes.includes(file.type) && file.size <= maxSize;
}

export function analyzeAudioData(audioBuffer: ArrayBuffer): Promise<number> {
  return new Promise((resolve) => {
    // Mock audio analysis - in real app would use Web Audio API
    const sampleDuration = Math.floor(audioBuffer.byteLength / 44100 / 2); // Rough estimate for 16-bit audio
    resolve(sampleDuration);
  });
}
