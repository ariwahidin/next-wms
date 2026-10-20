import ManualForm from "@/components/outbound/create-manual/ManualForm";
import Layout from "@/components/layout";
import { useRouter } from "next/router";

export default function EditPage() {
  const router = useRouter();
  const { no } = router.query;
  if (!no) return null;
  return  (
    <Layout title="Outbound" titleLink="/wms/outbound/data" subTitle={`Copy ${no}`}>
      <ManualForm />
    </Layout>
  );
}
