'use client';

import { motion, useInView } from 'framer-motion';
import type { TargetAndTransition } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';
import { useRef } from 'react';

const variants = {
  hidden: (y: number) => ({ opacity: 0, y }),
  visible: { opacity: 1, y: 0 },
};

type AnimateTag = 'div' | 'p' | 'h1' | 'h2' | 'article';

export function AnimateOnScroll({
  children,
  delay = 0,
  duration = 0.6,
  className,
  style,
  whileHover,
  y = 32,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
  whileHover?: TargetAndTransition;
  y?: number;
  as?: AnimateTag;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MotionComponent = motion[as] as typeof motion.div;

  if (prefersReduced) {
    const Component = as;
    return <Component className={className} style={style}>{children}</Component>;
  }

  return (
    <MotionComponent
      ref={ref}
      custom={y}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={whileHover}
      className={className}
      style={style}
    >
      {children}
    </MotionComponent>
  );
}
