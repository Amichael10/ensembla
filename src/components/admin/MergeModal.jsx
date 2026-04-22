import React, { useState } from 'react';

export default function MergeModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  items, 
  type = 'person' 
}) {
  const [primaryIndex, setPrimaryIndex] = useState(0);

  if (!isOpen || items.length < 2) return null;

  const primary = items[primaryIndex];
  const secondaries = items.filter((_, i) => i !== primaryIndex);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-border flex items-center justify-between bg-surface-2/50">
          <div>
            <h2 className="text-xl font-black text-text-primary tracking-tight">Merge {type === 'person' ? 'Talent Profiles' : 'Production Records'}</h2>
            <p className="text-sm text-text-muted font-medium mt-1">Consolidate duplicate records into a single source of truth.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-2 rounded-full transition-colors">
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-brand uppercase tracking-[0.2em] italic">Step 1: Select Primary Record</h3>
            <p className="text-xs text-text-muted leading-relaxed">Choose which record should survive. Missing data from other records will be copied to this one, and all credits/links will be moved here.</p>
            
            <div className="grid gap-3">
              {items.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setPrimaryIndex(idx)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    primaryIndex === idx 
                      ? 'border-brand bg-brand/5 shadow-lg shadow-brand/10' 
                      : 'border-border bg-surface-2 hover:border-brand/40'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    primaryIndex === idx ? 'border-brand bg-brand' : 'border-border bg-surface'
                  }`}>
                    {primaryIndex === idx && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  
                  <div className="w-12 h-12 rounded-lg bg-surface border border-border overflow-hidden flex-shrink-0">
                    <img src={item.photo_url || item.poster_url || 'https://via.placeholder.com/150'} alt="" className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="min-w-0 pr-4">
                    <div className="font-bold text-text-primary text-sm truncate">{item.name || item.title}</div>
                    <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
                      {type === 'person' ? (item.nationality || 'Unknown') : (item.year || 'TBD')} • ID: {item.id.substring(0,8)}
                    </div>
                  </div>
                  
                  {primaryIndex === idx && (
                    <div className="ml-auto flex items-center gap-2 text-brand">
                      <span className="text-[10px] font-black uppercase tracking-widest">Master Identity</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-xl space-y-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <h4 className="text-sm font-black text-red-600 dark:text-red-400">Irreversible Action Protocol</h4>
            </div>
            <ul className="space-y-2">
              <li className="text-[11px] text-text-muted font-medium flex gap-2">
                <span className="text-red-500 font-bold">•</span>
                <strong>{secondaries.length}</strong> record{secondaries.length > 1 ? 's' : ''} will be permanently purged from the registry.
              </li>
              <li className="text-[11px] text-text-muted font-medium flex gap-2">
                <span className="text-red-500 font-bold">•</span>
                All film metadata, credits, and links will be reassigned to <strong>{primary.name || primary.title}</strong>.
              </li>
            </ul>
          </div>
        </div>

        <div className="p-6 border-t border-border bg-surface-2/50 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-sm font-bold text-text-muted hover:text-text-primary transition-colors">Abort</button>
          <button
            onClick={() => onConfirm(primary.id, secondaries.map(s => s.id))}
            className="px-8 py-2.5 bg-brand text-white font-black text-sm rounded-lg shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Execute Merge
          </button>
        </div>
      </div>
    </div>
  );
}
