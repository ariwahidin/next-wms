// import { useEffect, useState } from "react";
// import eventBus from "@/utils/eventBus";

// const GlobalLoading = () => {
//   const [loading, setLoading] = useState(false);

//   //   useEffect(() => {
//   //     const showLoading = (status: boolean) => setLoading(status);
//   //     eventBus.on("loading", showLoading);

//   //     return () => {
//   //       eventBus.off("loading", showLoading);
//   //     };
//   //   }, []);

//   useEffect(() => {
//     const showLoading = (status: boolean) => {
//       console.log("GlobalLoading event received:", status); // Debug log
//       setLoading(status);
//     };
//     eventBus.on("loading", showLoading);

//     return () => {
//       eventBus.off("loading", showLoading);
//     };
//   }, []);

//   if (!loading) return null;

//   return (
//     <div className="loading-overlay">
//       <p>Loading...</p>
//     </div>
//   );
// };

// export default GlobalLoading;

import { useEffect, useState } from "react";
import eventBus from "@/utils/eventBus";
import { Dialog, DialogContent } from "@/components/ui/dialog"; // Import shadcn dialog

const GlobalLoading = () => {
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const showLoading = (status: boolean) => setLoading(status);
    eventBus.on("loading", showLoading);

    return () => {
      eventBus.off("loading", showLoading);
    };
  }, [isClient]);

  if (!isClient) return null;

  return (
    <Dialog open={loading}>
      <DialogContent className="bg-transparent shadow-none border-none flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalLoading;

