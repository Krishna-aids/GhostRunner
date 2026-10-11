import React, { useEffect, useRef, useState } from 'react';

export interface MascotChatProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'mascot' | 'user';
  text: string;
  timestamp: string;
  codeSnippet?: string;
  actionBadge?: string;
}

const PRESET_PROMPTS = [
  'How does locator healing work?',
  'Show healed patch example',
  'Run flakiness diagnostics',
  'Inspect test_checkout_flow failure',
];

export const MascotChat: React.FC<MascotChatProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'mascot',
      text: "GhostRunner AI Diagnostics active. I monitor your Playwright suites and automatically synthesize resilient locators when DOM elements drift.",
      timestamp: 'Just now',
      actionBadge: 'Auto-Healing Active',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, isTyping]);

  const handleSendMessage = (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Instant intelligent diagnostics response
    setTimeout(() => {
      let botResponse = '';
      let codeSnippet: string | undefined;
      let badge: string | undefined = 'Healed (94% conf)';

      const lower = trimmed.toLowerCase();
      if (lower.includes('checkout') || lower.includes('fail') || lower.includes('data-testid')) {
        botResponse =
          'Detected selector mutation: `button#checkout-submit` was replaced by design system update `button[data-testid="place-order-cta"]`. Validated and healed with 0ms downtime.';
        codeSnippet = `- await page.click('button#checkout-submit');\n+ await page.click('button[data-testid="place-order-cta"]'); // [GhostRunner Healed]`;
      } else if (lower.includes('heal') || lower.includes('how')) {
        botResponse =
          'When an assertion or action times out on a detached element, GhostRunner analyzes accessibility trees, DOM diffs, and sibling coordinates to synthesize a resilient replacement selector in ~32ms.';
        badge = 'Neural DOM Match';
      } else if (lower.includes('example') || lower.includes('show')) {
        botResponse =
          'Example verified patch generated for user login flow in Chromium:';
        codeSnippet = `// Original: input.user-email-v1\n// Healed replacement:\nawait page.getByRole('textbox', { name: /email address/i }).fill('qa@acme.corp');`;
      } else {
        botResponse = `Diagnostics complete. All active test suites are monitored with automated locator recovery enabled. No critical regressions detected.`;
        badge = 'Suites Protected';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          sender: 'mascot',
          text: botResponse,
          timestamp: 'Just now',
          codeSnippet,
          actionBadge: badge,
        },
      ]);
      setIsTyping(false);
    }, 450);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="GhostRunner AI Assistant Chat"
      className="fixed right-4 sm:right-6 bottom-24 sm:bottom-28 z-50 w-[350px] sm:w-[390px] max-w-[calc(100vw-2rem)] bg-surface-canvas/98 backdrop-blur-xl border border-border-strong rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn transition-all"
      style={{ maxHeight: 'calc(100vh - 140px)', height: '490px' }}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-surface-subtle border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative w-7 h-7 rounded-lg bg-surface-canvas border border-border-subtle flex items-center justify-center overflow-hidden p-0.5">
            <img
              src="/mascot.svg"
              alt="Ghosty Mascot"
              className="w-full h-full object-contain"
            />
            <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-status-success ring-1 ring-surface-canvas" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-text-primary">Ghosty Assistant</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-status-healed-subtle text-status-healed font-medium">Live</span>
            </div>
            <p className="text-[10px] text-text-muted leading-none mt-0.5">Automated Test Diagnostics</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-surface-canvas transition-colors cursor-pointer"
          aria-label="Close Chat"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-sans text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl p-3 shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-primary text-on-primary rounded-br-xs'
                  : 'bg-surface-subtle border border-border-subtle text-text-primary rounded-bl-xs'
              }`}
            >
              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

              {msg.codeSnippet && (
                <pre className="mt-2 p-2 bg-black/60 rounded-lg text-[11px] font-mono text-emerald-400 overflow-x-auto leading-tight border border-white/10">
                  <code>{msg.codeSnippet}</code>
                </pre>
              )}

              {msg.actionBadge && (
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  <span>{msg.actionBadge}</span>
                </div>
              )}
            </div>
            <span className="text-[10px] text-text-muted mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-1.5 text-text-muted px-2 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.3s]" />
            <span className="text-[11px] ml-1">Ghosty is healing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-3 py-1.5 border-t border-border-subtle bg-surface-subtle/50 flex gap-1.5 overflow-x-auto no-scrollbar">
        {PRESET_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-surface-canvas border border-border-strong text-text-secondary hover:text-text-primary hover:border-purple-500/40 transition-colors cursor-pointer shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputValue);
        }}
        className="p-2.5 border-t border-border-subtle bg-surface-canvas flex items-center gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask Ghosty about test selectors or runs..."
          className="flex-1 bg-surface-subtle border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="p-2 rounded-xl bg-primary text-on-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-container transition-colors cursor-pointer shrink-0"
          aria-label="Send message"
        >
          <span className="material-symbols-outlined text-[16px] leading-none">send</span>
        </button>
      </form>
    </div>
  );
};
