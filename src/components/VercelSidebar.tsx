import React, { useState } from 'react';

interface VercelSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const VercelSidebar: React.FC<VercelSidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}) => {
  const [showAiCredits, setShowAiCredits] = useState(true);

  const navItems = [
    { id: 'projects', label: 'Projects', icon: 'grid_view' },
    { id: 'deployments', label: 'Deployments', icon: 'deployed_code' },
    { id: 'logs', label: 'Logs', icon: 'format_list_bulleted', hasArrow: true },
    { id: 'analytics', label: 'Analytics', icon: 'show_chart' },
    { id: 'speed', label: 'Speed Insights', icon: 'speed' },
    { id: 'observability', label: 'Observability', icon: 'visibility', hasArrow: true },
    { id: 'firewall', label: 'Firewall', icon: 'security' },
    { id: 'cdn', label: 'CDN', icon: 'public' },
  ];

  const secondaryNavItems = [
    { id: 'env', label: 'Environment Variables', icon: 'data_object' },
    { id: 'domains', label: 'Domains', icon: 'language' },
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-60 bg-[#000000] border-r border-[#1a1a1a] z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* User scope selector: hk | Hobby ↕ */}
          <div className="h-14 px-3 flex items-center justify-between border-b border-[#1a1a1a]">
            <button
              type="button"
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#111111] transition-colors w-full text-left cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-[#10b981] flex items-center justify-center text-[10px] text-black font-black">
                hk
              </div>
              <span className="text-xs font-semibold text-[#ededed]">hk</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#1a1a1a] text-[#888888] border border-[#2a2a2a]">
                Hobby
              </span>
              <span className="material-symbols-outlined text-[16px] text-[#666666] ml-auto">
                unfold_more
              </span>
            </button>
          </div>

          {/* Search bar: Find [F] */}
          <div className="p-2.5">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[15px] text-[#666666]">
                search
              </span>
              <input
                type="text"
                placeholder="Find"
                className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg pl-8 pr-7 py-1 text-xs text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#333333]"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#666666] bg-[#141414] px-1 rounded border border-[#222222]">
                F
              </span>
            </div>
          </div>

          {/* Primary Nav Links */}
          <nav className="flex flex-col px-2 gap-0.5 mt-1">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#181818] text-[#ededed] font-semibold'
                      : 'text-[#888888] hover:text-[#ededed] hover:bg-[#0d0d0d]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`material-symbols-outlined text-[17px] ${
                        isActive ? 'text-[#ededed]' : 'text-[#888888]'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.hasArrow && (
                    <span className="material-symbols-outlined text-[13px] text-[#555555]">
                      chevron_right
                    </span>
                  )}
                </button>
              );
            })}

            <div className="h-[1px] bg-[#1a1a1a] my-2 mx-1" />

            {secondaryNavItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#181818] text-[#ededed] font-semibold'
                      : 'text-[#888888] hover:text-[#ededed] hover:bg-[#0d0d0d]'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[17px] ${
                      isActive ? 'text-[#ededed]' : 'text-[#888888]'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* AI Gateway Credits card at bottom */}
        {showAiCredits && (
          <div className="p-3 m-2 rounded-xl bg-[#0a0a0a] border border-[#1f1f1f] text-xs flex flex-col gap-1.5 relative">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#ededed] text-[11px]">AI Gateway Credits</span>
              <button
                type="button"
                onClick={() => setShowAiCredits(false)}
                className="text-[#666666] hover:text-[#ededed] p-0.5 cursor-pointer"
                title="Dismiss"
              >
                <span className="material-symbols-outlined text-[13px]">close</span>
              </button>
            </div>
            <p className="text-[10px] text-[#777777] leading-relaxed">
              Get $5 in Free AI Gateway Credit each month. You can use this credit only with eligible models, which have lower rate limits.
            </p>
          </div>
        )}
      </aside>
    </>
  );
};
