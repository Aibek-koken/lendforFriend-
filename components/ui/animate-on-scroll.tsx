'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import type { TargetAndTransition } from 'framer-motion';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

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
  const prefersReduced = useReducedMotion();
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const isInView = useInView(ref, {
    once: true,
    margin: isCompactViewport ? '-24px' : '-80px',
  });
  const MotionComponent = motion[as] as typeof motion.div;
  const resolvedYOffset = isCompactViewport ? Math.min(y, 18) : y;
  const resolvedDuration = isCompactViewport ? Math.min(duration, 0.45) : duration;

  useEffect(() => {
    const compactMq = window.matchMedia('(max-width: 767px)');
    const hoverMq = window.matchMedia('(hover: hover) and (pointer: fine)');

    const sync = () => {
      setIsCompactViewport(compactMq.matches);
      setCanHover(hoverMq.matches);
    };

    sync();
    compactMq.addEventListener('change', sync);
    hoverMq.addEventListener('change', sync);

    return () => {
      compactMq.removeEventListener('change', sync);
      hoverMq.removeEventListener('change', sync);
    };
  }, []);

  if (prefersReduced) {
    const Component = as;
    return <Component className={className} style={style}>{children}</Component>;
  }

  return (
    <MotionComponent
      ref={ref}
      custom={resolvedYOffset}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      transition={{
        duration: resolvedDuration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={canHover ? whileHover : undefined}
      className={className}
      style={style}
    >
      {children}
    </MotionComponent>
  );
}
