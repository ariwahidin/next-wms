
"use client";

import * as React from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  X,
  LayoutDashboard,
  PanelLeftClose,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";

import { usePageTabs } from "@/contexts/page-tabs-context";
import { cn } from "@/lib/utils";

type TabLimitEventDetail = {
  maxTabs?: number;
  message?: string;
};

type SortableTabProps = {
  id: string;
  title: string;
  active: boolean;
  canClose: boolean;
  onSelect: () => void;
  onClose: () => void;
};

function SortableTab({
  id,
  title,
  active,
  canClose,
  onSelect,
  onClose,
}: SortableTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: "relative",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-active={active}
      className={cn(
        "group flex h-10 max-w-[240px] min-w-[120px] shrink-0",
        "items-center gap-1 rounded-t-md border border-b-0 px-1",
        "transition-colors",
        active
          ? "border-border bg-background text-foreground"
          : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
        isDragging && "shadow-lg"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Move tab ${title}`}
        title="Drag to reorder"
        className={cn(
          "flex size-6 shrink-0 cursor-grab items-center justify-center",
          "rounded-sm touch-none active:cursor-grabbing",
          "text-muted-foreground hover:bg-muted-foreground/10",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        <GripVertical className="size-3.5" />
      </button>

      <button
        type="button"
        onClick={onSelect}
        title={title}
        className="flex min-w-0 flex-1 items-center gap-2 text-sm"
      >
        <LayoutDashboard
          className={cn(
            "size-4 shrink-0",
            active ? "text-primary" : "text-muted-foreground"
          )}
        />

        <span className="truncate">{title}</span>
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        aria-label={`Close ${title}`}
        title={`Close ${title}`}
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-sm",
          "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
          !canClose && "invisible"
        )}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function PageTabs() {
  const {
    tabs,
    activeUrl,
    openTab,
    closeTab,
    reorderTabs,
  } = usePageTabs();

  const scrollRef = React.useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    })
  );

  React.useEffect(() => {
    const activeElement =
      scrollRef.current?.querySelector('[data-active="true"]');

    activeElement?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [activeUrl, tabs.length]);

  React.useEffect(() => {
    const handleTabLimitReached = (event: Event) => {
      const customEvent =
        event as CustomEvent<TabLimitEventDetail>;

      const detail = customEvent.detail;

      toast.warning(
        detail?.message ??
          `Maximum ${detail?.maxTabs ?? 8} tabs. Please close unused tabs first.`,
        { duration: 5000 }
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

  const handleDragEnd = React.useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return;

      reorderTabs(String(active.id), String(over.id));
    },
    [reorderTabs]
  );

  const normalizedActiveUrl =
    activeUrl.replace(/\/+$/, "") || "/";

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <div
        ref={scrollRef}
        className="scrollbar-none flex min-w-0 flex-1 items-center gap-1 overflow-x-auto"
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tabs.map((tab) => tab.url)}
            strategy={horizontalListSortingStrategy}
          >
            {tabs.map((tab) => {
              const normalizedTabUrl =
                tab.url.replace(/\/+$/, "") || "/";

              const isActive =
                normalizedTabUrl === normalizedActiveUrl;

              return (
                <SortableTab
                  key={tab.url}
                  id={tab.url}
                  title={tab.title}
                  active={isActive}
                  canClose={tabs.length > 1}
                  onSelect={() => openTab(tab.title, tab.url)}
                  onClose={() => closeTab(tab.url)}
                />
              );
            })}
          </SortableContext>
        </DndContext>
      </div>

      <button
        type="button"
        onClick={() => openTab("Dashboard", "/wms/dashboard")}
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md",
          "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        title="Open Dashboard"
        aria-label="Open Dashboard"
      >
        <PanelLeftClose className="size-4" />
      </button>
    </div>
  );
}
