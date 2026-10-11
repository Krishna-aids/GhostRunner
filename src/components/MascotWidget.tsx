import React, { useEffect, useRef, useState } from 'react';
import { MascotChat } from './MascotChat';

interface MascotWidgetProps {
  onInteract?: () => void;
}

export const MascotWidget: React.FC<MascotWidgetProps> = ({ onInteract }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPlayable, setVideoPlayable] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;

    const handleCanPlay = () => {
      video.play().then(() => {
        setVideoPlayable(true);
      }).catch(() => {
        // Fallback gracefully to high-res SVG/PNG
        setVideoPlayable(false);
      });
    };

    const handleError = () => {
      setVideoPlayable(false);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    if (video.readyState >= 3) {
      handleCanPlay();
    }

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, []);

  // Display initial welcoming speech bubble after gentle delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasInteracted && !chatOpen) {
        setShowSpeechBubble(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [hasInteracted, chatOpen]);

  const handleMascotClick = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    // Toggle the full popup chat
    setChatOpen((prev) => !prev);
    setShowSpeechBubble(false);
    setHasInteracted(true);
    if (onInteract) onInteract();
  };

  return (
    <aside
      aria-label="GhostRunner Mascot Assistant"
      className="fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-50 pointer-events-auto select-none"
    >
      {/* Interactive Popup Assistant Chat */}
      <MascotChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Interactive Speech / Greeting Bubble (Anchored on Right above mascot) */}
      {showSpeechBubble && !chatOpen && (
        <div
          role="status"
          className="absolute right-0 bottom-full mb-3 w-64 sm:w-72 max-w-[calc(100vw-2rem)] bg-surface-canvas/98 backdrop-blur-md border border-border-strong rounded-2xl p-3.5 shadow-2xl text-xs transition-all duration-300 animate-fadeIn"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 font-semibold text-text-primary">
              <span className="w-2 h-2 rounded-full bg-status-success"></span>
              <span>Ghosty • AI Diagnostics</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowSpeechBubble(false);
                setHasInteracted(true);
              }}
              className="text-text-muted hover:text-text-primary p-0.5 rounded cursor-pointer transition-colors"
              aria-label="Close message"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
          <p className="mt-1.5 text-text-secondary leading-relaxed">
            Autonomous selector healing active. Click to inspect locator diffs or diagnose flaky tests.
          </p>
          <div className="mt-2.5 pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-muted">
            <span className="font-mono text-status-healed font-medium">99.4% Recovery Rate</span>
            <button
              type="button"
              className="text-primary font-medium hover:underline cursor-pointer flex items-center gap-1"
              onClick={handleMascotClick}
            >
              <span>Assistant</span>
              <span className="material-symbols-outlined text-[12px]">forum</span>
            </button>
          </div>

          {/* Speech bubble beak / arrow pointing to mascot on the right */}
          <div className="absolute right-12 top-full -mt-1.5 w-3 h-3 bg-surface-canvas border-r border-b border-border-strong transform rotate-45"></div>
        </div>
      )}

      {/* Mascot Launcher Button: Disappears like a ghost on hover, reappears smoothly when mouse moves away */}
      <div
        className="relative inline-flex flex-col items-center justify-end cursor-pointer group min-w-[130px] sm:min-w-[160px] md:min-w-[180px] min-h-[105px] sm:min-h-[120px] md:min-h-[135px] select-none"
        onClick={handleMascotClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleMascotClick();
          }
        }}
        aria-label="Interact with GhostRunner Mascot Assistant"
        title={chatOpen ? 'Close Ghosty AI Assistant' : 'Click to chat with Ghosty'}
      >
        {/* Invisible hit-box layer ensuring cursor presence is never interrupted */}
        <div className="absolute inset-0 pointer-events-auto" aria-hidden="true" />

        {/* Soft Radial Glow Effect */}
        <div
          aria-hidden="true"
          className="absolute -inset-4 sm:-inset-6 rounded-full pointer-events-none transition-all duration-700 ease-out opacity-0 scale-90 group-hover:opacity-0"
          style={{
            background:
              'radial-gradient(circle, rgba(168, 85, 247, 0.55) 0%, rgba(139, 92, 246, 0.28) 45%, rgba(99, 102, 241, 0.12) 65%, transparent 75%)',
            filter: 'blur(20px)',
          }}
        />

        {/* Mascot Container: Disappears smoothly like a ghost on hover (floats up into mist, blurs softly, and fades to opacity 0).
            Reappears with gentle floating motion when mouse leaves. */}
        <div className={`ghost-disappear relative ${isHovered ? 'ghost-hovered' : ''}`}>
          {/* Transparent Video player with VP9 yuva420p alpha channel */}
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className={`w-32 h-24 sm:w-40 sm:h-28 md:w-44 md:h-32 object-contain pointer-events-none select-none ${
              videoPlayable ? 'block' : 'hidden'
            }`}
          >
            <source src="/mascot.webm" type="video/webm" />
            <source src="/mascot.mp4" type="video/mp4" />
          </video>

          {/* Full-fidelity transparent vector Mascot graphic with smooth floating motion when video is warming up */}
          {!videoPlayable && (
            <div className="relative w-32 h-24 sm:w-40 sm:h-28 md:w-44 md:h-32 flex items-center justify-center select-none animate-mascot-float">
              <img
                src="/mascot.svg"
                alt="GhostRunner Mascot"
                className="w-full h-full object-contain pointer-events-none drop-shadow-sm select-none"
                draggable={false}
              />
            </div>
          )}
        </div>

        {/* Ethereal Ground Shadow beneath mascot, smoothly fades away with ghost */}
        <div className={`ghost-ground-shadow mx-auto -mt-1 pointer-events-none ${isHovered ? 'ghost-shadow-hovered' : ''}`}>
          <div
            className="w-20 sm:w-24 h-2.5 rounded-full bg-purple-500/25 dark:bg-purple-400/30 blur-[3px] animate-mascot-shadow"
            style={{ transformOrigin: 'center center' }}
          />
        </div>
      </div>
    </aside>
  );
};
