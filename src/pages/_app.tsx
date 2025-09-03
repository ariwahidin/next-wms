import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "sonner";
import { AlertProvider } from "@/contexts/AlertContext";
import { Provider } from "react-redux";
import { store, persistor } from "@/store";
import { PersistGate } from "redux-persist/integration/react";
import { LoadingProvider } from "@/contexts/LoadingContext";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AlertProvider>
          <LoadingProvider>
            <Component {...pageProps} />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  position: "absolute",
                },
              }}
            />
            <LoadingOverlay />
          </LoadingProvider>
        </AlertProvider>
      </PersistGate>
    </Provider>
  );
}
