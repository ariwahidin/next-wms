import Layout from "@/components/layout";
import ManualForm from "@/components/outbound/create-manual/ManualForm";

export default function CreateDNPage() {
  return (
    <Layout title="Outbound" titleLink="/wms/outbound/data" subTitle="Add Outbound">
      <ManualForm />
    </Layout>
  );
}
