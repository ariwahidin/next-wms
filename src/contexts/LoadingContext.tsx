import eventBus from "@/utils/eventBus";
import { createContext, useContext, useEffect, useState } from "react";

interface LoadingContextProps {
  loading: boolean;
  setLoading: (value: boolean) => void;
}

const LoadingContext = createContext<LoadingContextProps | undefined>(
  undefined
);

export const LoadingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const showLoading = (status: boolean) => {
      setLoading(status);

      console.log("status loading", status);
    };

    eventBus.on("loading", showLoading);

    return () => {
      eventBus.off("loading", showLoading);
    };
  });

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};
