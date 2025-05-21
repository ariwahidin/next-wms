// import { createContext, useContext, ReactNode, useEffect } from "react";
// import { toast } from "sonner";
// import eventBus from "@/utils/eventBus";

// interface AlertContextType {
//   showAlert: (title: string, description?: string, type?: "error" | "success") => void;
// }

// const AlertContext = createContext<AlertContextType | undefined>(undefined);

// export const AlertProvider = ({ children }: { children: ReactNode }) => {
//   useEffect(() => {
//     // Dengarkan event 'showAlert'
//     eventBus.on("showAlert", ({ title, description, type = "error" }) => {
//       toast[type](title, { description });
//     });

//     return () => {
//       eventBus.off("showAlert");
//     };
//   }, []);

//   const showAlert = (title: string, description?: string, type: "error" | "success" = "error") => {
//     eventBus.emit("showAlert", { title, description, type });
//   };

//   return <AlertContext.Provider value={{ showAlert }}>{children}</AlertContext.Provider>;
// };

// export const useAlert = () => {
//   const context = useContext(AlertContext);
//   if (!context) throw new Error("useAlert harus digunakan dalam AlertProvider");
//   return context;
// };

import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner"; // ✅ Untuk notifikasi
import eventBus from "@/utils/eventBus";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// 1. Tipe untuk context
interface AlertContextType {
  showAlert: (
    title: string,
    description?: string,
    type?: "error" | "success" | "info",
    onConfirm?: () => void // ✅ Callback ketika OK ditekan
  ) => void;
  notify: (title: string, description?: string, type?: "error" | "success") => void;
}

// 2. Buat Context
const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  // 3. State untuk Alert Dialog (Konfirmasi)
  const [alert, setAlert] = useState<{
    title: string;
    description?: string;
    type: "error" | "success" | "info";
    onConfirm?: () => void;
    isOpen: boolean;
  }>({
    title: "",
    description: "",
    type: "info",
    onConfirm: undefined,
    isOpen: false,
  });

  // 4. Listen event untuk toast notification
  useEffect(() => {
    eventBus.on("showAlert", ({ title, description, type = "error" }) => {
      toast[type](title, { description });
    });

    return () => {
      eventBus.off("showAlert");
    };
  }, []);

  // 5. Fungsi utama showAlert
  const showAlert = (
    title: string,
    description?: string,
    type: "error" | "success" | "info" = "info",
    onConfirm?: () => void
  ) => {
    if (onConfirm) {
      setAlert({ title, description, type, onConfirm, isOpen: true });
    } else {
      eventBus.emit("showAlert", { title, description, type });
    }
  };

  const notify = (title: string, description?: string, type: "error" | "success" = "error") => {
    toast[type](title, { description });
  };

  // 6. Fungsi untuk menutup dialog
  const closeAlert = () => {
    setAlert((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <AlertContext.Provider value={{ showAlert, notify }}>
      {children}
      <Dialog open={alert.isOpen} onOpenChange={closeAlert}>
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>{alert.title}</DialogTitle>
          </DialogHeader>
          <p className="mt-2">{alert.description}</p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={closeAlert}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (alert.onConfirm) alert.onConfirm(); // ✅ Jalankan function
                closeAlert(); // ✅ Tutup dialog
              }}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AlertContext.Provider>
  );
};

// 8. Custom Hook
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlert harus digunakan dalam AlertProvider");
  return context;
};
