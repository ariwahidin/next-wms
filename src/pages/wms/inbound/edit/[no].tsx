import ManualForm from "@/components/inbound/create-manual/ManualForm";
import Layout from "@/components/layout";
import { useRouter } from "next/router";

export default function EditPage() {
  const router = useRouter();
  const { no } = router.query;
  if (!no) return null;
  return  (
    <Layout title="Inbound" titleLink="/wms/inbound/data" subTitle={no}>
      <ManualForm />
    </Layout>
  );
}
