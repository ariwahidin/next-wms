import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "sonner";
import { AlertProvider} from "@/contexts/AlertContext";


export default function App({ Component, pageProps }: AppProps) {
  return (
    <AlertProvider>
      <Component {...pageProps} />
      <Toaster />
    </AlertProvider>
  );
}
