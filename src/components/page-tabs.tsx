
"use client";

import * as React from "react";
import { X, LayoutDashboard, PanelLeftClose } from "lucide-react";
import { toast } from "sonner";

import { usePageTabs } from "@/contexts/page-tabs-context";
import { cn } from "@/lib/utils";

type TabLimitEventDetail = {
  maxTabs?: number;
  message?: string;
};

export function PageTabs() {
  const { tabs, activeUrl, openTab, closeTab } = usePageTabs();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const activeElement = scrollRef.current?.querySelector(
      '[data-active="true"]'
    );

    activeElement?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [activeUrl, tabs.length]);

  // Tampilkan notifikasi ketika batas jumlah tab tercapai.
  React.useEffect(() => {
    const handleTabLimitReached = (event: Event) => {
      const customEvent = event as CustomEvent<TabLimitEventDetail>;
      const detail = customEvent.detail;

      toast.warning(
        detail?.message ??
          `Maximum ${detail?.maxTabs ?? 8} tabs. Please close unused tabs first.`,
        {
          duration: 5000,
        }
      );
    };

    window.addEventListener(
      "wms-tab-limit-reached",
      handleTabLimitReached
    );

    return () => {
      window.removeEventListener(
        "wms-tab-limit-reached",
        handleTabLimitReached
      );
    };
  }, []);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <div
        ref={scrollRef}
        className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-none"
      >
        {tabs.map((tab) => {
          const normalizedTabUrl =
            tab.url.replace(/\/+$/, "") || "/";

          const normalizedActiveUrl =
            activeUrl.replace(/\/+$/, "") || "/";

          const isActive = normalizedTabUrl === normalizedActiveUrl;

          return (
            <div
              key={tab.url}
              data-active={isActive}
              className={cn(
                "group flex h-10 max-w-[220px] shrink-0 items-center gap-2",
                "rounded-t-md border border-b-0 px-3 transition-colors",
                isActive
                  ? "border-border bg-background text-foreground"
                  : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <button
                type="button"
                onClick={() => openTab(tab.title, tab.url)}
                title={tab.title}
                className="flex min-w-0 flex-1 items-center gap-2 text-sm"
              >
                <LayoutDashboard
                  className={cn(
                    "size-4 shrink-0",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                />

                <span className="truncate">{tab.title}</span>
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  closeTab(tab.url);
                }}
                aria-label={`Close ${tab.title}`}
                title={`Close ${tab.title}`}
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-sm",
                  "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
                  tabs.length === 1 && "invisible"
                )}
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => openTab("Dashboard", "/wms/dashboard")}
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        title="Open Dashboard"
        aria-label="Open Dashboard"
      >
        <PanelLeftClose className="size-4" />
      </button>
    </div>
  );
}
