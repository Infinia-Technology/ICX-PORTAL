import { X, AlertTriangle } from 'lucide-react';

export default function DuplicateWarningModal({
  open,
  onClose,
  duplicates = [],
  onContinue,
  loading = false
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-96 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-semibold">Potential Duplicates Found</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-gray-600 mb-4">
            We found {duplicates.length} listing(s) that may be similar to what you're creating.
            Please review before proceeding.
          </p>

          {duplicates.length > 0 ? (
            <div className="space-y-3">
              {duplicates.map((dup, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-4 bg-amber-50 border-amber-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">{dup.name}</h3>
                      <p className="text-sm text-gray-600">{dup.location || 'Unknown Location'}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-amber-200 text-amber-900 px-3 py-1 rounded-full text-sm font-semibold">
                        {dup.similarity}% match
                      </span>
                    </div>
                  </div>

                  {dup.distance && (
                    <p className="text-xs text-gray-500">
                      GPS Distance: {dup.distance}m away
                    </p>
                  )}

                  <p className="text-xs text-gray-600 mt-2">
                    <strong>Reason:</strong> {dup.reason}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No duplicates found</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Go Back
          </button>
          <button
            onClick={onContinue}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
