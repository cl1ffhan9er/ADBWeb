export const CHUNK_DURATION_SECONDS = 10;

export function getExpectedChunkCount(durationSeconds: number): number {
  return Math.ceil(durationSeconds / CHUNK_DURATION_SECONDS);
}