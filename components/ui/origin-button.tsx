"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";

const FILL_DURATION_MS = 500;
const FILL_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getCoverDiameter(width: number, height: number, x: number, y: number) {
  return Math.ceil(
    2 *
      Math.max(
        Math.hypot(x, y),
        Math.hypot(width - x, y),
        Math.hypot(x, height - y),
        Math.hypot(width - x, height - y)
      )
  );
}

function assignRef<T>(ref: React.ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
    return;
  }

  if (ref) {
    ref.current = value;
  }
}

function hasTextContent(node: React.ReactNode): boolean {
  if (typeof node === "string" || typeof node === "number") {
    return String(node).trim().length > 0;
  }

  if (Array.isArray(node)) {
    return node.some(hasTextContent);
  }

  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return hasTextContent(node.props.children);
  }

  return false;
}

type OriginVisualProps = {
  children?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  loading?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "primary" | "platform";
};

type OriginLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
  OriginVisualProps;

type OriginButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  OriginVisualProps;

const sizeClassName = {
  xs: "min-h-[34px] px-3 text-[11px]",
  sm: "min-h-[44px] px-5 text-[15px]",
  md: "min-h-[48px] px-6 text-[15px]",
  lg: "min-h-[54px] px-6 text-[15px]",
  xl: "min-h-[58px] px-8 text-[17px]",
} as const;

const primaryClassName =
  "rounded-full border-white/45 bg-[linear-gradient(180deg,#62bdff_0%,#2585ff_50%,#125be8_100%)] text-center shadow-[inset_0_2px_0_rgba(255,255,255,0.36),inset_0_-18px_28px_rgba(18,91,232,0.36),0_18px_36px_rgba(37,133,255,0.26)]";

const platformClassName =
  "min-h-[78px] w-full justify-start rounded-[26px] border-white/45 bg-[linear-gradient(180deg,#62bdff_0%,#2585ff_52%,#125be8_100%)] px-4 py-3.5 text-left shadow-[inset_0_2px_0_rgba(255,255,255,0.34),inset_0_-22px_34px_rgba(18,91,232,0.34),0_22px_46px_rgba(37,133,255,0.25)]";

function useOriginInteraction<T extends HTMLElement>(
  disabled: boolean,
  children: React.ReactNode,
  ariaLabel?: string,
  ariaLabelledBy?: string
) {
  const elementRef = React.useRef<T | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [hovered, setHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);
  const [origin, setOrigin] = React.useState({ x: 0, y: 0 });
  const [coverSize, setCoverSize] = React.useState(0);

  React.useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    if (hasTextContent(children) || ariaLabel?.trim() || ariaLabelledBy?.trim()) {
      return;
    }

    console.warn(
      "OriginButton: provide visible label text or aria-label / aria-labelledby so the control has an accessible name."
    );
  }, [ariaLabel, ariaLabelledBy, children]);

  const updateOrigin = React.useCallback((x: number, y: number) => {
    const node = elementRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    setOrigin({ x, y });
    setCoverSize(getCoverDiameter(rect.width, rect.height, x, y));
  }, []);

  const updateOriginFromPointer = React.useCallback(
    (event: React.PointerEvent<T>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      updateOrigin(event.clientX - rect.left, event.clientY - rect.top);
    },
    [updateOrigin]
  );

  const updateOriginFromCenter = React.useCallback(() => {
    const node = elementRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    updateOrigin(rect.width / 2, rect.height / 2);
  }, [updateOrigin]);

  const showFill = !disabled && (hovered || isPressed);

  React.useLayoutEffect(() => {
    const node = elementRef.current;
    if (!(node && showFill)) return;

    const measure = () => {
      const rect = node.getBoundingClientRect();
      setCoverSize(getCoverDiameter(rect.width, rect.height, origin.x, origin.y));
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);

    const fonts = document.fonts;
    if (fonts?.ready) {
      fonts.ready.then(measure).catch(() => undefined);
    }

    return () => observer.disconnect();
  }, [showFill, origin.x, origin.y]);

  const fillStyle: React.CSSProperties = {
    height: coverSize,
    left: origin.x,
    opacity: showFill ? 1 : 0,
    top: origin.y,
    transform: `translate(-50%, -50%) scale(${showFill && coverSize > 0 ? 1 : 0})`,
    transition: prefersReducedMotion
      ? "none"
      : `transform ${FILL_DURATION_MS}ms ${FILL_EASE}, opacity 150ms ease-out`,
    width: coverSize,
  };

  return {
    elementRef,
    fillStyle,
    hovered,
    isPressed,
    setHovered,
    setIsPressed,
    updateOriginFromCenter,
    updateOriginFromPointer,
  };
}

function RootVisual({
  children,
  contentClassName,
  fillStyle,
}: {
  children: React.ReactNode;
  contentClassName?: string;
  fillStyle: React.CSSProperties;
}) {
  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -z-10 rounded-full bg-[radial-gradient(circle_at_center,#9ee6ff_0%,#49a8ff_34%,#166cff_66%,#0d48c7_100%)]"
        style={fillStyle}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-4 top-1 -z-10 h-1/2 rounded-full bg-white/24 blur-[2px]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-[linear-gradient(180deg,transparent,rgba(9,68,185,0.2))]"
      />
      <span className={cx("relative z-10 inline-flex min-w-0 items-center justify-center gap-2", contentClassName)}>
        {children}
      </span>
    </>
  );
}

const OriginLink = React.forwardRef<HTMLAnchorElement, OriginLinkProps>(
  (
    {
      children,
      className,
      contentClassName,
      loading = false,
      onBlur,
      onClick,
      onFocus,
      onPointerCancel,
      onPointerDown,
      onPointerEnter,
      onPointerLeave,
      onPointerUp,
      size = "md",
      variant = "primary",
      ...props
    },
    ref
  ) => {
    const ariaLabel = props["aria-label"];
    const ariaLabelledBy = props["aria-labelledby"];
    const origin = useOriginInteraction<HTMLAnchorElement>(
      loading,
      children,
      ariaLabel,
      ariaLabelledBy
    );

    const setMergedRef = React.useCallback(
      (node: HTMLAnchorElement | null) => {
        origin.elementRef.current = node;
        assignRef(ref, node);
      },
      [origin.elementRef, ref]
    );

    return (
      <a
        {...props}
        aria-busy={loading || undefined}
        aria-disabled={loading || undefined}
        className={cx(
          "relative isolate inline-flex cursor-pointer touch-manipulation select-none items-center justify-center overflow-hidden border font-[800] leading-none text-white",
          "motion-safe:transition-[transform,filter] motion-safe:duration-150 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-px",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2585ff] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          loading && "pointer-events-none opacity-70",
          variant === "primary" && primaryClassName,
          variant === "primary" && sizeClassName[size],
          variant === "platform" && platformClassName,
          className
        )}
        data-pressed={origin.isPressed ? "true" : "false"}
        onBlur={(event) => {
          onBlur?.(event);
          origin.setIsPressed(false);
          if (!event.defaultPrevented) {
            origin.setHovered(false);
          }
        }}
        onClick={(event) => {
          if (loading) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
        }}
        onFocus={(event) => {
          onFocus?.(event);
          if (loading || event.defaultPrevented) return;
          if (event.currentTarget.matches(":focus-visible")) {
            origin.updateOriginFromCenter();
            origin.setHovered(true);
          }
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          origin.setIsPressed(false);
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (event.defaultPrevented || loading || event.button !== 0) return;
          origin.updateOriginFromPointer(event);
          origin.setIsPressed(true);
          origin.setHovered(true);
        }}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (loading || event.defaultPrevented) return;
          origin.updateOriginFromPointer(event);
          origin.setHovered(true);
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          origin.setHovered(false);
          origin.setIsPressed(false);
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          origin.setIsPressed(false);
        }}
        ref={setMergedRef}
      >
        <RootVisual contentClassName={contentClassName} fillStyle={origin.fillStyle}>
          {children}
        </RootVisual>
      </a>
    );
  }
);
OriginLink.displayName = "OriginLink";

const OriginButton = React.forwardRef<HTMLButtonElement, OriginButtonProps>(
  (
    {
      children,
      className,
      contentClassName,
      disabled = false,
      loading = false,
      onBlur,
      onFocus,
      onKeyDown,
      onKeyUp,
      onPointerCancel,
      onPointerDown,
      onPointerEnter,
      onPointerLeave,
      onPointerUp,
      size = "md",
      type = "button",
      variant = "primary",
      ...props
    },
    ref
  ) => {
    const isDisabled = Boolean(disabled || loading);
    const ariaLabel = props["aria-label"];
    const ariaLabelledBy = props["aria-labelledby"];
    const origin = useOriginInteraction<HTMLButtonElement>(
      isDisabled,
      children,
      ariaLabel,
      ariaLabelledBy
    );

    const setMergedRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        origin.elementRef.current = node;
        assignRef(ref, node);
      },
      [origin.elementRef, ref]
    );

    return (
      <button
        {...props}
        aria-busy={loading || undefined}
        className={cx(
          "relative isolate inline-flex cursor-pointer touch-manipulation select-none items-center justify-center overflow-hidden border font-[800] leading-none text-white",
          "motion-safe:transition-[transform,filter] motion-safe:duration-150 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-px",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2585ff] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          "disabled:pointer-events-none disabled:opacity-70",
          variant === "primary" && primaryClassName,
          variant === "primary" && sizeClassName[size],
          variant === "platform" && platformClassName,
          className
        )}
        data-pressed={origin.isPressed ? "true" : "false"}
        disabled={isDisabled}
        onBlur={(event) => {
          onBlur?.(event);
          origin.setIsPressed(false);
          if (!event.defaultPrevented) {
            origin.setHovered(false);
          }
        }}
        onFocus={(event) => {
          onFocus?.(event);
          if (isDisabled || event.defaultPrevented) return;
          if (event.currentTarget.matches(":focus-visible")) {
            origin.updateOriginFromCenter();
            origin.setHovered(true);
          }
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);

          if (
            event.defaultPrevented ||
            isDisabled ||
            event.repeat ||
            (event.key !== " " && event.key !== "Enter")
          ) {
            return;
          }

          if (event.key === " ") {
            event.preventDefault();
          }

          origin.updateOriginFromCenter();
          origin.setIsPressed(true);
          origin.setHovered(true);
        }}
        onKeyUp={(event) => {
          onKeyUp?.(event);

          if (event.key === " " || event.key === "Enter") {
            origin.setIsPressed(false);
            if (!event.currentTarget.matches(":focus-visible")) {
              origin.setHovered(false);
            }
          }
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          origin.setIsPressed(false);
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (event.defaultPrevented || isDisabled || event.button !== 0) return;
          origin.updateOriginFromPointer(event);
          origin.setIsPressed(true);
          origin.setHovered(true);
        }}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (isDisabled || event.defaultPrevented) return;
          origin.updateOriginFromPointer(event);
          origin.setHovered(true);
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          origin.setHovered(false);
          origin.setIsPressed(false);
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          origin.setIsPressed(false);
        }}
        ref={setMergedRef}
        type={type}
      >
        <RootVisual contentClassName={contentClassName} fillStyle={origin.fillStyle}>
          {children}
        </RootVisual>
      </button>
    );
  }
);
OriginButton.displayName = "OriginButton";

export { OriginButton, OriginLink };
export type { OriginButtonProps, OriginLinkProps };
