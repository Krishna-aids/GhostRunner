import React, { useState } from 'react';
import { EvidenceArtifact } from '../../types/domain';

interface EvidenceGalleryProps {
  artifacts: EvidenceArtifact[];
}

export const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({ artifacts }) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const screenshots = artifacts.filter((a) => a.artifact_type === 'screenshot');
  const consoleLogs = artifacts.filter((a) => a.artifact_type === 'console_log');
  const otherArtifacts = artifacts.filter(
    (a) => a.artifact_type !== 'screenshot' && a.artifact_type !== 'console_log'
  );

  return (
    <div className="bg-surface-canvas rounded-2xl border border-border-subtle p-5 sm:p-6 shadow-xs flex flex-col gap-5">
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">find_in_page</span>
          </div>
          <div className="flex flex-col">
            <h3 className="font-semibold text-sm text-text-primary">Evidence &amp; Artifacts</h3>
            <span className="text-[11px] text-text-muted">
              {artifacts.length} captured trace artifacts during failure execution
            </span>
          </div>
        </div>
      </div>

      {/* 1. Screenshots Gallery */}
      {screenshots.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono font-medium text-text-muted uppercase tracking-wider">
            Failure Screenshots (Click to Expand)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {screenshots.map((s) => (
              <div
                key={s.id}
                onClick={() => setZoomedImage(s.url || 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80')}
                className="group relative aspect-video rounded-xl overflow-hidden border border-border-strong bg-black cursor-pointer shadow-xs hover:border-primary transition-all"
              >
                <img
                  src={s.url || 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80'}
                  alt="Failure screenshot"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[20px]">zoom_in</span>
                </div>
                <div className="absolute bottom-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] font-mono text-white">
                  Step failure
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Console Logs */}
      {consoleLogs.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-mono font-medium text-text-muted uppercase tracking-wider">
            Console Logs
          </span>
          <div className="rounded-xl border border-border-subtle bg-[#0a0a0a] text-slate-300 p-3.5 font-mono text-xs max-h-48 overflow-y-auto leading-relaxed shadow-inner">
            <pre className="whitespace-pre-wrap font-mono">
              {consoleLogs.map((l) => l.content || l.storage_path).join('\n\n')}
            </pre>
          </div>
        </div>
      )}

      {/* 3. Other Artifacts (DOM, Trace, Network) */}
      {otherArtifacts.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 border-t border-border-subtle">
          <span className="text-xs font-mono font-medium text-text-muted uppercase tracking-wider">
            Diagnostic Files &amp; Downloads
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {otherArtifacts.map((art) => (
              <a
                key={art.id}
                href={art.url || '#'}
                download={art.storage_path.split('/').pop()}
                onClick={(e) => {
                  if (!art.url || art.url.startsWith('#')) {
                    e.preventDefault();
                    alert(`Downloading artifact: ${art.storage_path}`);
                  }
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-border-subtle hover:border-border-strong bg-surface-subtle hover:bg-surface-canvas transition-colors text-xs text-text-primary group"
              >
                <span className="material-symbols-outlined text-[18px] text-text-secondary group-hover:text-primary transition-colors">
                  {art.artifact_type === 'trace'
                    ? 'timeline'
                    : art.artifact_type === 'dom_snapshot'
                    ? 'html'
                    : 'description'}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold truncate uppercase text-[11px] font-mono">
                    {art.artifact_type.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-text-muted truncate">
                    {art.storage_path}
                  </span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-text-muted ml-auto">
                  download
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out animate-in fade-in duration-150"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
            <img src={zoomedImage} alt="Expanded evidence" className="w-full h-auto object-contain max-h-[85vh]" />
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
