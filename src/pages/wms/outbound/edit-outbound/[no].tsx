// import ManualForm from "@/components/outbound/create-manual/ManualForm";
// import Layout from "@/components/layout";
// import { useRouter } from "next/router";

// export default function EditPage() {
//   const router = useRouter();
//   const { no } = router.query;
//   if (!no) return null;
//   const outboundNo = Array.isArray(no) ? no[0] : no;
//   return  (
//     <Layout title="Outbound" titleLink="/wms/outbound/data" subTitle={outboundNo}>
//       <ManualForm />
//     </Layout>
//   );
// }


import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ManualForm from "@/components/outbound/create-manual/ManualForm";
import Layout from "@/components/layout";

export default function EditPage() {
  const router = useRouter();
  const [outboundNo, setOutboundNo] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    const value = router.query.no;
    if (!value) return;

    const resolved = Array.isArray(value) ? value[0] : value;

    setOutboundNo((current) => current ?? resolved);
  }, [router.isReady, router.query.no]);

  if (!outboundNo) return null;

  return (
    <Layout
      title="Outbound"
      titleLink="/wms/outbound/data"
      subTitle={outboundNo}
    >
      <ManualForm
        key={`outbound-edit-${outboundNo}`}
        mode="edit"
        outboundNo={outboundNo}
      />
    </Layout>
  );
}