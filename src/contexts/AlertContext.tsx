import { createContext, useContext, ReactNode, useEffect } from "react";
import { toast } from "sonner";
import eventBus from "@/utils/eventBus";

interface AlertContextType {
  showAlert: (title: string, description?: string, type?: "error" | "success") => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    // Dengarkan event 'showAlert'
    eventBus.on("showAlert", ({ title, description, type = "error" }) => {
      toast[type](title, { description });
    });

    return () => {
      eventBus.off("showAlert");
    };
  }, []);

  const showAlert = (title: string, description?: string, type: "error" | "success" = "error") => {
    eventBus.emit("showAlert", { title, description, type });
  };

  return <AlertContext.Provider value={{ showAlert }}>{children}</AlertContext.Provider>;
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlert harus digunakan dalam AlertProvider");
  return context;
};
