import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "sonner";
import { AlertProvider} from "@/contexts/AlertContext";
import GlobalLoading from "@/components/GlobalLoading";


export default function App({ Component, pageProps }: AppProps) {
  return (
    <AlertProvider>
      {/* <GlobalLoading /> */}
      <Component {...pageProps} />
      <Toaster />
    </AlertProvider>
  );
}
