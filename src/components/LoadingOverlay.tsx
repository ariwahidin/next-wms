// components/LoadingOverlay.tsx
import { useLoading } from "@/contexts/LoadingContext";
import React from "react";
import BasicLoadingOverlay from "./basicLoadingOverlay";

const LoadingOverlay = () => {
  const { loading } = useLoading();
  if (!loading) return null;
  return (
    <BasicLoadingOverlay isLoading={loading} message="Please wait..." />
  );
};

export default LoadingOverlay;
