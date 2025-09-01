/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  use,
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
  notify: (
    title: string,
    description?: string,
    type?: "error" | "success"
  ) => void;
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
      // toast[type](title, { description });
      const styles = {
        error: {
          style: {
            background: "#fee2e2", // light red
            color: "#dc2626",
            border: "1px solid #fecaca",
          },
        },
        success: {
          style: {
            background: "#dcfce7", // light green
            color: "#16a34a",
            border: "1px solid #bbf7d0",
          },
        },
      };

      toast[type](title, {
        description,
        ...styles[type],
      });
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
    console.log("Event listener untuk showAlert telah di-setup");
    if (onConfirm) {
      setAlert({ title, description, type, onConfirm, isOpen: true });
    } else {
      eventBus.emit("showAlert", { title, description, type });
    }
  };

  // const notify = (title: string, description?: string, type: "error" | "success" = "error") => {
  //   toast[type](title, { description });
  // };

  // const notify = (
  //   title: string,
  //   description?: string,
  //   type: "error" | "success" = "error"
  // ) => {
  //   const styles = {
  //     error: {
  //       style: {
  //         background: "#fee2e2", // light red
  //         color: "#dc2626",
  //         border: "1px solid #fecaca",
  //       },
  //     },
  //     success: {
  //       style: {
  //         background: "#dcfce7", // light green
  //         color: "#16a34a",
  //         border: "1px solid #bbf7d0",
  //       },
  //     },
  //   };

  //   toast[type](title, {
  //     description,
  //     ...styles[type],
  //   });
  // };

  const notify = (
    title: string,
    description?: string,
    type: "error" | "success" = "error"
  ) => {
    const config = {
      error: {
        description,
        variant: "destructive" as const,
        className: "bg-red-100 border-red-300",
      },
      success: {
        description,
        variant: "default" as const,
        className: "bg-green-100 border-green-300",
      },
    };

    toast[type](title, config[type]);
  };

  // 6. Fungsi untuk menutup dialog
  const closeAlert = () => {
    setAlert((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    document.body.style.removeProperty("pointer-events");
  }, [alert.isOpen]);

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
