
"use client";

import * as React from "react";
import { useRouter } from "next/router";
import { arrayMove } from "@dnd-kit/sortable";

export type PageTab = {
  title: string;
  url: string;
};

type PageTabsContextValue = {
  tabs: PageTab[];
  activeUrl: string;
  openTab: (title: string, url: string) => void;
  closeTab: (url: string) => void;
  closeTabAndNavigate: (
    currentUrl: string,
    targetTitle: string,
    targetUrl: string,
    reload?: boolean
  ) => Promise<void>;
  reorderTabs: (activeUrl: string, overUrl: string) => void;
};

const PageTabsContext =
  React.createContext<PageTabsContextValue | null>(null);

const STORAGE_KEY = "wms-page-tabs";
const MAX_TABS = 8;

const DEFAULT_TAB: PageTab = {
  title: "Dashboard",
  url: "/wms/dashboard",
};

const EXCLUDED_TAB_URLS = ["/auth/login", "/auth/conflict"];

function normalizeUrl(url: string): string {
  return (
    url.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/"
  );
}

function isExcludedTab(url: string): boolean {
  const normalizedUrl = normalizeUrl(url);

  return EXCLUDED_TAB_URLS.some(
    (excludedUrl) => normalizeUrl(excludedUrl) === normalizedUrl
  );
}

function isValidInternalUrl(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

function getFallbackTitle(url: string): string {
  const segment = normalizeUrl(url).split("/").filter(Boolean).pop();

  if (!segment) return "Dashboard";

  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function sanitizeTabs(tabs: PageTab[]): PageTab[] {
  const uniqueTabs: PageTab[] = [];

  for (const tab of tabs) {
    if (!isValidInternalUrl(tab.url) || isExcludedTab(tab.url)) {
      continue;
    }

    const normalizedUrl = normalizeUrl(tab.url);

    if (
      uniqueTabs.some(
        (item) => normalizeUrl(item.url) === normalizedUrl
      )
    ) {
      continue;
    }

    uniqueTabs.push({
      title: tab.title,
      url: normalizedUrl,
    });

    if (uniqueTabs.length >= MAX_TABS) break;
  }

  return uniqueTabs;
}

function notifyTabLimit() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("wms-tab-limit-reached", {
      detail: {
        maxTabs: MAX_TABS,
        message: `Maximum ${MAX_TABS} tabs. Please close unused tabs first.`,
      },
    })
  );
}

function notifyTabClosed(url: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("wms-tab-closed", {
      detail: { url: normalizeUrl(url) },
    })
  );
}

function notifyTabOpened(url: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("wms-tab-opened", {
      detail: { url: normalizeUrl(url) },
    })
  );
}

export function PageTabsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [tabs, setTabs] = React.useState<PageTab[]>([DEFAULT_TAB]);
  const [hydrated, setHydrated] = React.useState(false);

  const activeUrl = normalizeUrl(router.asPath || DEFAULT_TAB.url);
  const isExcludedRoute = isExcludedTab(activeUrl);

  // Restore tabs from sessionStorage.
  React.useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);

      if (!saved) {
        setTabs([DEFAULT_TAB]);
        return;
      }

      const parsed: unknown = JSON.parse(saved);

      if (!Array.isArray(parsed)) {
        setTabs([DEFAULT_TAB]);
        return;
      }

      const validTabs = parsed.filter(
        (tab): tab is PageTab =>
          typeof tab?.title === "string" &&
          typeof tab?.url === "string" &&
          isValidInternalUrl(tab.url) &&
          !isExcludedTab(tab.url)
      );

      const restoredTabs = sanitizeTabs(validTabs);

      setTabs(
        restoredTabs.length > 0 ? restoredTabs : [DEFAULT_TAB]
      );
    } catch {
      setTabs([DEFAULT_TAB]);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Register the active route if it is not already open.
  React.useEffect(() => {
    if (!hydrated || !router.isReady || isExcludedRoute) return;

    setTabs((current) => {
      if (
        current.some((tab) => normalizeUrl(tab.url) === activeUrl)
      ) {
        return current;
      }

      if (current.length >= MAX_TABS) {
        notifyTabLimit();
        return current;
      }

      return [
        ...current,
        {
          title: getFallbackTitle(activeUrl),
          url: activeUrl,
        },
      ];
    });
  }, [activeUrl, hydrated, isExcludedRoute, router.isReady]);

  // Persist the current tab list, including its order.
  React.useEffect(() => {
    if (!hydrated) return;

    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(sanitizeTabs(tabs))
      );
    } catch {
      // Navigation still works if sessionStorage is unavailable.
    }
  }, [tabs, hydrated]);

  // Open an existing tab or create a new one.
  const openTab = React.useCallback(
    (title: string, url: string) => {
      if (!isValidInternalUrl(url)) return;

      const normalizedUrl = normalizeUrl(url);

      if (isExcludedTab(normalizedUrl)) {
        void router.push(url);
        return;
      }

      const existing = tabs.find(
        (tab) => normalizeUrl(tab.url) === normalizedUrl
      );

      if (existing) {
        setTabs((current) =>
          current.map((tab) =>
            normalizeUrl(tab.url) === normalizedUrl
              ? { ...tab, title }
              : tab
          )
        );

        if (activeUrl !== normalizedUrl) {
          void router.push(url);
        }

        return;
      }

      if (tabs.length >= MAX_TABS) {
        notifyTabLimit();
        return;
      }

      setTabs((current) => {
        if (
          current.some(
            (tab) => normalizeUrl(tab.url) === normalizedUrl
          )
        ) {
          return current;
        }

        if (current.length >= MAX_TABS) {
          notifyTabLimit();
          return current;
        }

        notifyTabOpened(normalizedUrl);

        return [...current, { title, url: normalizedUrl }];
      });

      if (activeUrl !== normalizedUrl) {
        void router.push(url);
      }
    },
    [tabs, activeUrl, router]
  );

  // Reorder tabs without changing their URLs or page identities.
  const reorderTabs = React.useCallback(
    (activeTabUrl: string, overTabUrl: string) => {
      setTabs((current) => {
        const oldIndex = current.findIndex(
          (tab) => tab.url === activeTabUrl
        );

        const newIndex = current.findIndex(
          (tab) => tab.url === overTabUrl
        );

        if (
          oldIndex < 0 ||
          newIndex < 0 ||
          oldIndex === newIndex
        ) {
          return current;
        }

        return arrayMove(current, oldIndex, newIndex);
      });
    },
    []
  );

  // Close a tab and remove its Keep-Alive instance.
  const closeTab = React.useCallback(
    (url: string) => {
      const normalizedUrl = normalizeUrl(url);

      const index = tabs.findIndex(
        (tab) => normalizeUrl(tab.url) === normalizedUrl
      );

      if (index < 0) return;

      notifyTabClosed(normalizedUrl);

      const remaining = tabs.filter(
        (tab) => normalizeUrl(tab.url) !== normalizedUrl
      );

      if (remaining.length === 0) {
        remaining.push(DEFAULT_TAB);
      }

      setTabs(remaining);

      if (activeUrl === normalizedUrl) {
        const nextIndex = Math.min(index, remaining.length - 1);
        void router.push(remaining[nextIndex].url);
      }
    },
    [tabs, activeUrl, router]
  );

  // Close the source tab and navigate to a target tab.

  const closeTabAndNavigate = React.useCallback(
    async (
      currentUrl: string,
      targetTitle: string,
      targetUrl: string,
      reload: boolean = false
    ) => {
      if (
        !isValidInternalUrl(targetUrl) ||
        isExcludedTab(targetUrl)
      ) {
        return;
      }

      const normalizedCurrentUrl = normalizeUrl(currentUrl);
      const normalizedTargetUrl = normalizeUrl(targetUrl);

      notifyTabClosed(normalizedCurrentUrl);

      setTabs((current) => {
        const remaining = current.filter(
          (tab) => normalizeUrl(tab.url) !== normalizedCurrentUrl
        );

        const targetExists = remaining.some(
          (tab) => normalizeUrl(tab.url) === normalizedTargetUrl
        );

        if (targetExists) {
          return remaining.map((tab) =>
            normalizeUrl(tab.url) === normalizedTargetUrl
              ? { ...tab, title: targetTitle }
              : tab
          );
        }

        const next = [
          ...remaining,
          { title: targetTitle, url: normalizedTargetUrl },
        ];

        if (next.length > MAX_TABS) {
          notifyTabLimit();
          return remaining;
        }

        return next;
      });

      // const navigated = await router.push(targetUrl);

      // if (navigated && reload) {
      //   window.dispatchEvent(
      //     new CustomEvent("wms-page-reload", {
      //       detail: { url: normalizedTargetUrl },
      //     })
      //   );
      // }

      const navigated = await router.push(targetUrl);

      if (navigated && reload) {
        window.dispatchEvent(
          new CustomEvent("wms-page-reload", {
            detail: { url: normalizedTargetUrl },
          })
        );
      }
    },
    [router]
  );

  // const closeTabAndNavigate = React.useCallback(
  //   async (
  //     currentUrl: string,
  //     targetTitle: string,
  //     targetUrl: string,
  //     reload: boolean = false
  //   ) => {
  //     if (
  //       !isValidInternalUrl(targetUrl) ||
  //       isExcludedTab(targetUrl)
  //     ) {
  //       return;
  //     }

  //     const normalizedCurrentUrl = normalizeUrl(currentUrl);
  //     const normalizedTargetUrl = normalizeUrl(targetUrl);

  //     notifyTabClosed(normalizedCurrentUrl);

  //     setTabs((current) => {
  //       const remaining = current.filter(
  //         (tab) =>
  //           normalizeUrl(tab.url) !== normalizedCurrentUrl
  //       );

  //       const targetExists = remaining.some(
  //         (tab) =>
  //           normalizeUrl(tab.url) === normalizedTargetUrl
  //       );

  //       if (targetExists) {
  //         return remaining.map((tab) =>
  //           normalizeUrl(tab.url) === normalizedTargetUrl
  //             ? { ...tab, title: targetTitle }
  //             : tab
  //         );
  //       }

  //       const next = [
  //         ...remaining,
  //         {
  //           title: targetTitle,
  //           url: normalizedTargetUrl,
  //         },
  //       ];

  //       if (next.length > MAX_TABS) {
  //         notifyTabLimit();
  //         return remaining;
  //       }

  //       return next;
  //     });

  //     const navigated = await router.push(targetUrl);

  //     if (navigated && reload) {
  //       router.reload();
  //     }
  //   },
  //   [router]
  // );


  // const closeTabAndNavigate = React.useCallback(
  //   (
  //     currentUrl: string,
  //     targetTitle: string,
  //     targetUrl: string
  //   ) => {
  //     if (
  //       !isValidInternalUrl(targetUrl) ||
  //       isExcludedTab(targetUrl)
  //     ) {
  //       return;
  //     }

  //     const normalizedCurrentUrl = normalizeUrl(currentUrl);
  //     const normalizedTargetUrl = normalizeUrl(targetUrl);

  //     notifyTabClosed(normalizedCurrentUrl);

  //     setTabs((current) => {
  //       const remaining = current.filter(
  //         (tab) =>
  //           normalizeUrl(tab.url) !== normalizedCurrentUrl
  //       );

  //       const targetExists = remaining.some(
  //         (tab) =>
  //           normalizeUrl(tab.url) === normalizedTargetUrl
  //       );

  //       if (targetExists) {
  //         return remaining.map((tab) =>
  //           normalizeUrl(tab.url) === normalizedTargetUrl
  //             ? { ...tab, title: targetTitle }
  //             : tab
  //         );
  //       }

  //       const next = [
  //         ...remaining,
  //         {
  //           title: targetTitle,
  //           url: normalizedTargetUrl,
  //         },
  //       ];

  //       if (next.length > MAX_TABS) {
  //         notifyTabLimit();
  //         return remaining;
  //       }

  //       return next;
  //     });

  //     void router.push(targetUrl);
  //   },
  //   [router]
  // );

  const value = React.useMemo(
    () => ({
      tabs,
      activeUrl,
      openTab,
      closeTab,
      closeTabAndNavigate,
      reorderTabs,
    }),
    [
      tabs,
      activeUrl,
      openTab,
      closeTab,
      closeTabAndNavigate,
      reorderTabs,
    ]
  );

  return (
    <PageTabsContext.Provider value={value}>
      {children}
    </PageTabsContext.Provider>
  );
}

export function usePageTabs() {
  const context = React.useContext(PageTabsContext);

  if (!context) {
    throw new Error(
      "usePageTabs must be used within PageTabsProvider."
    );
  }

  return context;
}
