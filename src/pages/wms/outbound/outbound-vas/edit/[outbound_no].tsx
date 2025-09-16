import ManualForm from "@/components/outbound-vas/ManualForm";
import Layout from "@/components/layout";
import { useRouter } from "next/router";

export default function EditPage() {
  const router = useRouter();
  const { outbound_no } = router.query;
  if (!outbound_no) return null;
  return  (
    <Layout title="VAS Outbound" titleLink="/wms/outbound/data" subTitle={outbound_no}>
      <ManualForm />
    </Layout>
  );
}
