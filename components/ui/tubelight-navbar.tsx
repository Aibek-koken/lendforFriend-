'use client';

import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';

export type TubelightNavItem = {
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
  setActiveTab: (name: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="inline-flex items-center justify-center gap-1 rounded-full border border-[#e5e5ea] bg-[rgba(255,255,255,0.72)] p-1 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] backdrop-blur-xl">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;

          return (
            <a
              key={item.name}
              href={item.url}
              onClick={() => setActiveTab(item.name)}
              className={`relative isolate inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-[14px] text-[13px] font-[560] transition-colors duration-150 ${
                isActive ? 'text-[#5e5ce6]' : 'text-[#6e6e73] hover:text-[#5e5ce6]'
              }`}
            >
              {isActive ? (
                <motion.span
                  layoutId="tubelight-active-tab"
                  className="absolute inset-0 -z-10 rounded-full bg-[rgba(94,92,230,0.10)] shadow-[0_0_0_1px_rgba(94,92,230,0.18)_inset,0_8px_18px_rgba(94,92,230,0.12)]"
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
