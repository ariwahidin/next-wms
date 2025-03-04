import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertProvider, useAlert } from "@/contexts/AlertContext";

function GlobalAlert() {
  const { alert } = useAlert();

  if (!alert) return null;

  return (
    <Alert variant={alert.variant}>
      <AlertTitle>{alert.title}</AlertTitle>
      {alert.description && (
        <AlertDescription>{alert.description}</AlertDescription>
      )}
    </Alert>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  // return <Component {...pageProps} />;
  return (
    <AlertProvider>
      <GlobalAlert />
      <Component {...pageProps} />
      <Toaster />
    </AlertProvider>
  );
}
