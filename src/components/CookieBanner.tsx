import React, { useState } from 'react';

export const CookieBanner: React.FC = () => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm p-4 rounded-xl bg-[#0a0a0a] border border-[#222222] shadow-2xl text-xs text-[#ededed] flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <p className="text-[#a1a1a1] text-xs leading-relaxed">
        This site uses tracking technologies. You may opt in or opt out of the use of these technologies.
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="px-3 py-1 rounded-full bg-[#181818] border border-[#2a2a2a] text-[#ededed] text-xs hover:bg-[#222222] transition-colors cursor-pointer"
        >
          Deny
        </button>

        <button
          type="button"
          onClick={() => setVisible(false)}
          className="px-3 py-1 rounded-full bg-[#181818] border border-[#2a2a2a] text-[#ededed] text-xs hover:bg-[#222222] transition-colors cursor-pointer"
        >
          Accept all
        </button>

        <button
          type="button"
          onClick={() => setVisible(false)}
          className="px-3.5 py-1 rounded-full bg-[#ffffff] text-[#000000] font-medium text-xs hover:bg-[#eaeaea] transition-colors cursor-pointer"
        >
          Consent Settings
        </button>
      </div>
    </div>
  );
};
