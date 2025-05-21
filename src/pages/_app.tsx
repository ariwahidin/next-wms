import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "sonner";
import { AlertProvider } from "@/contexts/AlertContext";
import { Provider } from "react-redux";
import { store, persistor } from '@/store';
import { PersistGate } from "redux-persist/integration/react";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AlertProvider>
          <Component {...pageProps} />
          <Toaster />
        </AlertProvider>
      </PersistGate>
    </Provider>
  );
}
