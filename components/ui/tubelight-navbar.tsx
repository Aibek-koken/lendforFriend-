'use client';

import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';

export type TubelightNavItem = {
  id: string;
  name: string;
  url: string;
  icon: LucideIcon;
};

export function NavBar({
  items,
  activeTab,
  setActiveTab,
  className,
}: {
  items: TubelightNavItem[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="inline-flex items-center justify-center rounded-[28px] border border-[rgba(29,29,31,0.06)] bg-[rgba(242,242,247,0.92)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] backdrop-blur-sm">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <a
              key={item.id}
              href={item.url}
              onClick={() => setActiveTab(item.id)}
              className={`relative isolate inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-[14px] text-[13px] font-[560] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e5ce6] focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                isActive ? 'text-[#5e5ce6]' : 'text-[#6e6e73] hover:text-[#5e5ce6]'
              }`}
            >
              {isActive ? (
                <motion.span
                  layoutId="tubelight-active-tab"
                  className="absolute inset-0 -z-10 rounded-full border border-[rgba(99,91,255,0.18)] bg-[linear-gradient(180deg,rgba(240,243,255,0.98)_0%,rgba(228,234,255,0.9)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              ) : null}
              <Icon size={15} aria-hidden="true" />
              <span>{item.name}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
