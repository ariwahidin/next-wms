// import "@/styles/globals.css";
// import type { AppProps } from "next/app";
// import { Toaster } from "sonner";
// import { AlertProvider } from "@/contexts/AlertContext";
// import { Provider } from "react-redux";
// import { store, persistor } from "@/store";
// import { PersistGate } from "redux-persist/integration/react";
// import { LoadingProvider } from "@/contexts/LoadingContext";
// import LoadingOverlay from "@/components/LoadingOverlay";
// import GlobalAlertSound from "@/components/GlobalAlertSound";

// export default function App({ Component, pageProps }: AppProps) {
//   return (
//     <Provider store={store}>
//       <PersistGate loading={null} persistor={persistor}>
//         <AlertProvider>
//           <LoadingProvider>
//             <GlobalAlertSound />
//             <Component {...pageProps} />
//             <Toaster
//               position="top-right"
//               toastOptions={{
//                 style: {
//                   position: "absolute",
//                 },
//               }}
//             />
//             <LoadingOverlay />
//           </LoadingProvider>
//         </AlertProvider>
//       </PersistGate>
//     </Provider>
//   );
// }


import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import * as React from "react";
import { Toaster } from "sonner";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import { AlertProvider } from "@/contexts/AlertContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { PageTabsProvider } from "@/contexts/page-tabs-context";
import { KeepAlivePageProvider } from "@/contexts/keep-alive-page-context";

import { store, persistor } from "@/store";
import LoadingOverlay from "@/components/LoadingOverlay";
import GlobalAlertSound from "@/components/GlobalAlertSound";
import { useEffect } from "react";

type PageComponentWithKeepAlive = AppProps["Component"] & {
  keepAlive?: boolean;
};

type CachedPage = {
  key: string;
  Component: AppProps["Component"];
  pageProps: AppProps["pageProps"];
};

// function getPageKey(url: string): string {
//   return url.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
// }

// function getPageKey(asPath: string): string {
//   const path = asPath.split("?")[0].split("#")[0];
//   return path.replace(/\/+$/, "") || "/";
// }

function getPageKey(asPath: string): string {
  const [rawPath, rawQuery = ""] = asPath.split("#")[0].split("?");
  const path = rawPath.replace(/\/+$/, "") || "/";

  if (path === "/wms/inbound/edit-inbound") {
    const params = new URLSearchParams(rawQuery);
    const no = params.get("no");

    return no ? `${path}?no=${no}` : path;
  }

  return path;
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const activeKey = getPageKey(router.asPath);
  const PageComponent = Component as PageComponentWithKeepAlive;
  const shouldKeepAlive = PageComponent.keepAlive !== false;

  const [cachedPages, setCachedPages] = React.useState<CachedPage[]>([]);

  // Hapus instance halaman dari cache saat tab benar-benar ditutup.
  React.useEffect(() => {
    const handleTabClosed = (event: Event) => {
      const customEvent = event as CustomEvent<{ url?: string }>;
      const closedUrl = customEvent.detail?.url;

      if (!closedUrl) return;

      const closedKey = getPageKey(closedUrl);

      setCachedPages((current) =>
        current.filter((page) => getPageKey(page.key) !== closedKey)
      );
    };

    window.addEventListener("wms-tab-closed", handleTabClosed);

    return () => {
      window.removeEventListener("wms-tab-closed", handleTabClosed);
    };
  }, []);

  // Simpan halaman baru ke cache tanpa mengganti instance yang sudah ada.
  React.useEffect(() => {
    if (!router.isReady) return;

    setCachedPages((current) => {
      if (!shouldKeepAlive) {
        return current.filter((page) => page.key !== activeKey);
      }

      const exists = current.some((page) => page.key === activeKey);

      if (exists) {
        return current;
      }

      return [
        ...current,
        {
          key: activeKey,
          Component,
          pageProps,
        },
      ];
    });
  }, [
    activeKey,
    Component,
    pageProps,
    router.isReady,
    shouldKeepAlive,
  ]);

  const pagesToRender = React.useMemo(() => {
    const pages = shouldKeepAlive
      ? cachedPages
      : cachedPages.filter((page) => page.key !== activeKey);

    const activePageExists = pages.some(
      (page) => page.key === activeKey
    );

    if (activePageExists) {
      return pages;
    }

    // Render halaman aktif sambil menunggu cache diperbarui.
    return [
      ...pages,
      {
        key: activeKey,
        Component,
        pageProps,
      },
    ];
  }, [
    cachedPages,
    activeKey,
    Component,
    pageProps,
    shouldKeepAlive,
  ]);

  useEffect(() => {
    console.log("[ManualForm] MOUNT");

    return () => {
      console.log("[ManualForm] UNMOUNT");
    };
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AlertProvider>
          <LoadingProvider>
            <PageTabsProvider>
              <GlobalAlertSound />

              {pagesToRender.map((page) => {
                const isActive = page.key === activeKey;
                const CurrentPage = page.Component;

                return (
                  <KeepAlivePageProvider
                    key={page.key}
                    value={isActive}
                  >
                    <div
                      data-page-key={page.key}
                      hidden={!isActive}
                      className={isActive ? "min-h-full" : undefined}
                    >
                      <CurrentPage {...page.pageProps} />
                    </div>
                  </KeepAlivePageProvider>
                );
              })}

              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    position: "absolute",
                  },
                }}
              />

              <LoadingOverlay />
            </PageTabsProvider>
          </LoadingProvider>
        </AlertProvider>
      </PersistGate>
    </Provider>
  );
}


