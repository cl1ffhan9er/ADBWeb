"use client";

type HelpDialogProps = {
  onClose: () => void;
};

export default function HelpDialog({ onClose }: HelpDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">How to use ADBWeb</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>Upload a Cebuano speech audio file (.wav or .mp3, 3–60 seconds, max 10MB)</li>
          <li>Click &quot;Analyze Audio&quot; to submit it for detection</li>
          <li>Wait a few moments while the system processes your file</li>
          <li>View the result: Real or Fake, with an authenticity score</li>
        </ol>
      </div>
    </div>
  );
}