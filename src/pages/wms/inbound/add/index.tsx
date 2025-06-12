import ManualForm from "@/components/inbound/create-manual/ManualForm";
import Layout from "@/components/layout";

export default function CreateDNPage() {
  return (
    <Layout title="Inbound" titleLink="/wms/inbound/data" subTitle="Add Inbound">
        <ManualForm />
    </Layout>
  );
}
