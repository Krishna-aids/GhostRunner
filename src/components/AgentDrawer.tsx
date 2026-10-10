import React, { useState } from 'react';

interface AgentDrawerProps {
  onClose: () => void;
  onRunTest: () => void;
}

export const AgentDrawer: React.FC<AgentDrawerProps> = ({
  onClose,
  onRunTest,
}) => {
  const [messages, setMessages] = useState<Array<{ role: 'agent' | 'user'; text: string; action?: string }>>([
    {
      role: 'agent',
      text: "Hello! I am your Autonomous Self-Healing Agent. I monitor your connected GitHub repositories for UI DOM mutations, intercept flaky timeout errors in Playwright/Cypress tests, and auto-stage pull requests with corrected selectors.",
    },
    {
      role: 'agent',
      text: "Recent scan on `Krishna-aids/Table-Talk`: recovered `button#checkout-submit` to `button[data-testid='place-order-cta']` (94% confidence). Would you like to run the test suite now?",
      action: 'run_test',
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const userText = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          text: `Analyzing ${userText}... Verified AST and accessibility tree. 0 DOM collisions detected. All self-healing hooks are active.`,
        },
      ]);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#0a0a0a] h-full shadow-2xl border-l border-[#222222] flex flex-col overflow-hidden text-xs text-[#ededed]">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-[#1f1f1f] flex items-center justify-between bg-[#000000]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#162744] text-[#0070f3] flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xs text-[#ededed]">Self-Healing Agent</span>
              <span className="text-[10px] text-[#00df72] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00df72]"></span>
                Online • Multi-Repo Monitor
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#666666] hover:text-[#ededed] hover:bg-[#181818] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Chat message stream */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl max-w-[90%] leading-relaxed ${
                m.role === 'agent'
                  ? 'bg-[#141414] border border-[#222222] text-[#ededed] self-start'
                  : 'bg-[#0070f3] text-[#ffffff] self-end'
              }`}
            >
              <p className="text-xs">{m.text}</p>
              {m.action === 'run_test' && (
                <button
                  type="button"
                  onClick={() => {
                    onRunTest();
                    onClose();
                  }}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ffffff] text-[#000000] font-semibold text-xs hover:bg-[#eaeaea] transition-all cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                  <span>Run Self-Healing Suite</span>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Input box */}
        <div className="p-3 border-t border-[#1f1f1f] bg-[#000000] flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask agent to inspect locators or stage PRs..."
            className="flex-1 bg-[#121212] border border-[#262626] rounded-lg px-3 py-2 text-xs text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#0070f3]"
          />
          <button
            type="button"
            onClick={handleSend}
            className="p-2 rounded-lg bg-[#0070f3] text-white hover:bg-[#005cd6] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
