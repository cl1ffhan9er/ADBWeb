export const CHUNK_DURATION_SECONDS = 64600 / 16000;

export function getExpectedChunkCount(durationSeconds: number): number {
  return Math.max(1, Math.ceil(durationSeconds / CHUNK_DURATION_SECONDS));
}
