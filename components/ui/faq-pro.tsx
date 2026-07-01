'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export type FaqProItem = {
  id: string;
  question: string;
  answer: string;
};

const EASE = [0.16, 1, 0.3, 1] as const;

export function FaqPro({
  items,
  defaultOpenFirst = false,
  className,
}: {
  items: FaqProItem[];
  defaultOpenFirst?: boolean;
  className?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenFirst ? items[0]?.id ?? null : null);
  const prefersReduced = useReducedMotion();

  return (
    <div className={className}>
      <motion.div layout className="space-y-3">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((item, index) => {
            const isOpen = openId === item.id;

            return (
              <motion.article
                key={item.id}
                layout
                initial={prefersReduced ? false : { opacity: 0, y: 16 }}
                whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
                exit={prefersReduced ? undefined : { opacity: 0, y: -8, scale: 0.985 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  type: 'spring',
                  stiffness: 360,
                  damping: 32,
                  opacity: { duration: 0.5, ease: EASE, delay: prefersReduced ? 0 : index * 0.05 },
                  y: { duration: 0.5, ease: EASE, delay: prefersReduced ? 0 : index * 0.05 },
                }}
                className={`overflow-hidden rounded-[16px] border bg-white transition-[border-color,box-shadow] duration-300 ${
                  isOpen
                    ? 'border-[rgba(217,152,30,0.32)] shadow-[0_18px_40px_-18px_rgba(217,152,30,0.3)]'
                    : 'border-[#eae5e5] hover:border-[rgba(217,152,30,0.2)]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left text-[16px] font-[600] transition-colors hover:bg-[#fffafa]"
                  aria-expanded={isOpen}
                  aria-controls={`faq-pro-panel-${item.id}`}
                >
                  <span className={isOpen ? 'text-[#1a1917]' : ''}>{item.question}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className={`flex h-7 w-7 flex-none items-center justify-center rounded-full transition-colors duration-300 ${
                      isOpen ? 'bg-[rgba(217,152,30,0.1)] text-[#a35707]' : 'bg-[#f7f5f5] text-[#6b665e]'
                    }`}
                    aria-hidden="true"
                  >
                    <ChevronDown size={16} />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      id={`faq-pro-panel-${item.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: { duration: 0.32, ease: EASE },
                        opacity: { duration: 0.24, ease: EASE },
                      }}
                      className="overflow-hidden"
                    >
                      <motion.div
                        initial={prefersReduced ? false : { y: -6, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.3, ease: EASE, delay: 0.04 }}
                        className="px-5 pb-5 text-[16px] font-[400] leading-[1.6] text-[#6b665e]"
                      >
                        {item.answer}
                      </motion.div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
