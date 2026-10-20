
// import ManualForm from "@/components/inbound/create-manual/ManualForm";
// import Layout from "@/components/layout";
// import { useRouter } from "next/router";

// export default function EditPage() {
//   const router = useRouter();
//   const { no } = router.query;

//   if (!router.isReady || !no) return null;

//   const inboundNo = Array.isArray(no) ? no[0] : no;

//   return (
//     <Layout
//       title="Inbound"
//       titleLink="/wms/inbound/data-inbound"
//       subTitle={inboundNo}
//     >
//       <ManualForm key={`inbound-edit-${inboundNo}`} />
//     </Layout>
//   );
// }


// import ManualForm from "@/components/inbound/create-manual/ManualForm";
// import Layout from "@/components/layout";
// import { useRouter } from "next/router";

// export default function EditPage() {
//   const router = useRouter();
//   const { no } = router.query;

//   if (!router.isReady || !no) return null;

//   const inboundNo = Array.isArray(no) ? no[0] : no;

//   return (
//     <Layout
//       title="Inbound"
//       titleLink="/wms/inbound/data-inbound"
//       subTitle={inboundNo}
//     >
//       <ManualForm
//         key={`inbound-edit-${inboundNo}`}
//         mode="edit"
//         inboundNo={inboundNo}
//       />
//     </Layout>
//   );
// }

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ManualForm from "@/components/inbound/create-manual/ManualForm";
import Layout from "@/components/layout";

export default function EditPage() {
  const router = useRouter();
  const [inboundNo, setInboundNo] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    const value = router.query.no;
    if (!value) return;

    const resolved = Array.isArray(value) ? value[0] : value;

    // Simpan nomor pertama kali; jangan timpa ketika pindah tab.
    setInboundNo((current) => current ?? resolved);
  }, [router.isReady, router.query.no]);

  if (!inboundNo) return null;

  return (
    <Layout
      title="Inbound"
      titleLink="/wms/inbound/data-inbound"
      subTitle={inboundNo}
    >
      <ManualForm
        key={`inbound-edit-${inboundNo}`}
        mode="edit"
        inboundNo={inboundNo}
      />
    </Layout>
  );
}