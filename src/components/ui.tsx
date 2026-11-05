"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className={`brand ${dark ? "brand-dark" : ""}`} aria-label="Velora home">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
      </span>
      <span>velora</span>
    </span>
  );
}

export function VerifiedBadge({ label = "Photo verified" }: { label?: string }) {
  return (
    <span className="verified-badge" title={label}>
      <Check size={11} strokeWidth={3} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function Modal({
  open,
  onClose,
  children,
  className = "",
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  label: string;
}) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className={`modal-panel ${className}`}
            initial={{ opacity: 0, y: 28, scale: 0.975 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
          >
            <button className="modal-close icon-button" onClick={onClose} aria-label="Close dialog">
              <X size={19} />
            </button>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? "is-on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 35 }} />
    </button>
  );
}

export function Avatar({ src, alt, size = 42 }: { src: string; alt: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="avatar"
      style={{ width: size, height: size }}
    />
  );
}

export function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          className="toast"
          role="status"
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
        >
          <span className="toast-check"><Check size={14} /></span>
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
