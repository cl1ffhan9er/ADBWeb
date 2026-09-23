"use client";

type ChunkProgressProps = {
  currentChunk: number;
  totalChunks: number;
};

export default function ChunkProgress({ currentChunk, totalChunks }: ChunkProgressProps) {
  const percent = Math.min((currentChunk / totalChunks) * 100, 100);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 w-72">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-600 text-sm">
          Analyzing chunk {Math.min(currentChunk, totalChunks)} of {totalChunks}
        </p>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}