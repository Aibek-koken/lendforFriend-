'use client';

import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

export type FaqProItem = {
  id: string;
  question: string;
  answer: string;
};

export function FaqPro({
  items,
  defaultOpenFirst = false,
  className,
  searchPlaceholder = 'Search questions...',
}: {
  items: FaqProItem[];
  defaultOpenFirst?: boolean;
  className?: string;
  searchPlaceholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(defaultOpenFirst ? items[0]?.id ?? null : null);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;

    return items.filter((item) => {
      return `${item.question} ${item.answer}`.toLowerCase().includes(normalized);
    });
  }, [items, query]);

  return (
    <div className={className}>
      <div className="relative mb-5">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6e6e73]"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          className="w-full min-h-[48px] rounded-full border border-[#e5e5ea] bg-white px-11 text-[15px] text-[#1d1d1f] placeholder:text-[#6e6e73] focus-visible:outline-[3px] focus-visible:outline-[rgba(94,92,230,0.42)] focus-visible:outline-offset-[3px]"
          aria-label={searchPlaceholder}
        />
      </div>

      <div className="space-y-3">
        {filteredItems.map((item) => {
          const isOpen = openId === item.id;

          return (
            <motion.article
              key={item.id}
              layout
              className="overflow-hidden rounded-[16px] border border-[#e5e5ea] bg-white"
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left text-[15px] font-[650] transition-colors hover:bg-[#fafafa]"
                aria-expanded={isOpen}
                aria-controls={`faq-pro-panel-${item.id}`}
              >
                <span>{item.question}</span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="flex-none text-[#6e6e73]"
                  aria-hidden="true"
                >
                  <ChevronDown size={18} />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    id={`faq-pro-panel-${item.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-[14px] leading-[1.6] text-[#6e6e73]">
                      {item.answer}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
