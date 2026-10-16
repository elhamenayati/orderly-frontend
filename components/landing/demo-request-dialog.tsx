"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DemoRequestForm } from "@/components/landing/demo-request-form";

type DemoRequestContextValue = {
  openDemoRequest: () => void;
};

const DemoRequestContext = createContext<DemoRequestContextValue | null>(null);

export function useDemoRequest() {
  const ctx = useContext(DemoRequestContext);
  if (!ctx) {
    throw new Error("useDemoRequest must be used within DemoRequestProvider");
  }
  return ctx;
}

export function DemoRequestProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openDemoRequest = useCallback(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    function openFromHash() {
      if (window.location.hash === "#demo") {
        setOpen(true);
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`,
        );
      }
    }

    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest('a[href="#demo"]');
      if (!link) return;
      event.preventDefault();
      setOpen(true);
    }

    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", openFromHash);
      document.removeEventListener("click", onClick);
    };
  }, []);

  const value = useMemo(() => ({ openDemoRequest }), [openDemoRequest]);

  return (
    <DemoRequestContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg overflow-hidden p-0" dir="rtl">
          <DialogHeader>
            <DialogTitle>درخواست دمو</DialogTitle>
            <DialogDescription>
              اطلاعات تماس خود را وارد کنید تا برای جلسه کوتاه دمو با شما هماهنگ
              کنیم.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            <DemoRequestForm className="rounded-none border-0 bg-transparent p-0" />
          </div>
        </DialogContent>
      </Dialog>
    </DemoRequestContext.Provider>
  );
}
