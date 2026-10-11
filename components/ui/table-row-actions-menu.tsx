"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type TableRowActionsMenuProps = {
  children: ReactNode;
  ariaLabel?: string;
  triggerClassName?: string;
  menuClassName?: string;
};

type MenuPosition = {
  top: number;
  left: number;
};

function computeMenuPosition(
  triggerRect: DOMRect,
  menuRect: DOMRect,
): MenuPosition {
  const isRtl = getComputedStyle(document.documentElement).direction === "rtl";
  const margin = 8;
  const gap = 4;

  let top = triggerRect.bottom + gap;
  let left = isRtl
    ? triggerRect.left
    : triggerRect.right - menuRect.width;

  left = Math.max(margin, Math.min(left, window.innerWidth - menuRect.width - margin));

  if (top + menuRect.height > window.innerHeight - margin) {
    top = triggerRect.top - menuRect.height - gap;
  }

  top = Math.max(margin, top);

  return { top, left };
}

export function TableRowActionsMenu({
  children,
  ariaLabel = "عملیات",
  triggerClassName,
  menuClassName,
}: TableRowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ top: 0, left: 0 });
  const [positioned, setPositioned] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    setPosition(computeMenuPosition(trigger.getBoundingClientRect(), menu.getBoundingClientRect()));
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPositioned(false);
      return;
    }
    updatePosition();
    setPositioned(true);
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, close, updatePosition]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          "flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted",
          triggerClassName,
        )}
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <MoreVertical className="size-4" />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed inset-0 z-[200] cursor-default bg-transparent"
                aria-label="بستن منو"
                onClick={close}
              />
              <div
                ref={menuRef}
                className={cn(
                  "fixed z-[210] min-w-40 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-lg",
                  menuClassName,
                )}
                style={{
                  top: position.top,
                  left: position.left,
                  visibility: positioned ? "visible" : "hidden",
                }}
                onClick={close}
              >
                {children}
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}

export const tableRowActionsMenuItemClassName =
  "block px-3 py-2 text-sm transition hover:bg-muted";
