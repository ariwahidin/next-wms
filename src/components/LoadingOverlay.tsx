// components/LoadingOverlay.tsx
import { useLoading } from "@/contexts/LoadingContext";
import React from "react";

const LoadingOverlay = () => {
  const { loading } = useLoading();

  if (!loading) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div className="spinner" />
    </div>
  );
};

export default LoadingOverlay;
