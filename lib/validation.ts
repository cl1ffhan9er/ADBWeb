export type ValidationResult = {
  valid: boolean;
  error?: string;
};

const ALLOWED_TYPES = ["audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp3"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB, per REQ-UPLOAD-5
const MIN_DURATION_SECONDS = 3;   // REQ-UPLOAD-7
const MAX_DURATION_SECONDS = 60;  // REQ-UPLOAD-7

export function validateFileType(file: File): ValidationResult {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file format. Please upload a .wav or .mp3 file.",
    };
  }
  return { valid: true };
}

export function validateFileSize(file: File): ValidationResult {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: "File size too large. Maximum file size: 10 MB",
    };
  }
  return { valid: true };
}

export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);

    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(objectUrl); // free the memory once we have what we need
      resolve(audio.duration);
    });

    audio.addEventListener("error", () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read audio file"));
    });

    audio.src = objectUrl;
  });
}

export function validateDuration(durationSeconds: number): ValidationResult {
  if (durationSeconds < MIN_DURATION_SECONDS) {
    return {
      valid: false,
      error: "Duration too short. Minimum duration: 3 seconds.",
    };
  }
  if (durationSeconds > MAX_DURATION_SECONDS) {
    return {
      valid: false,
      error: "Duration too long. Maximum duration: 60 seconds",
    };
  }
  return { valid: true };
}

/**
 * Runs all checks in order and returns the first failure, or a success
 * result if everything passes. Order matters: cheapest/fastest checks
 * (type, size) run before the async duration check.
 */
export async function validateAudioFile(file: File): Promise<ValidationResult> {
  const typeResult = validateFileType(file);
  if (!typeResult.valid) return typeResult;

  const sizeResult = validateFileSize(file);
  if (!sizeResult.valid) return sizeResult;

  try {
    const duration = await getAudioDuration(file);
    return validateDuration(duration);
  } catch {
    return { valid: false, error: "Could not read audio file. It may be corrupted." };
  }
}