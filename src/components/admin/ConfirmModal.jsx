export default function ConfirmModal({ title, message, confirmLabel = 'Confirm', confirmColor = 'bg-red-500 hover:bg-red-600', onConfirm, onCancel, isProcessing = false }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={!isProcessing ? onCancel : undefined}
      />
      
      {/* Modal */}
      <div className="relative bg-surface rounded-lg shadow-2xl border border-border w-full max-w-sm p-8 animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-text-primary mb-2 tracking-tight">
          {title}
        </h3>
        <p className="text-text-muted mb-8 leading-relaxed">
          {message}
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className={`w-full py-2.5 rounded-md text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${confirmColor}`}
          >
            {isProcessing ? 'Processing...' : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="w-full py-2.5 rounded-md text-sm font-bold text-text-primary bg-surface-2 hover:bg-surface border border-border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
