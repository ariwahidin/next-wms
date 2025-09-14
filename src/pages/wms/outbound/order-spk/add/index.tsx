import Layout from "@/components/layout";
import ManualForm from "@/components/order-spk/ManualForm";

export default function CreateDNPage() {
  return (
    <Layout title="Order SPK" titleLink="/wms/order-spk/data" subTitle="Add Order">
      <ManualForm />
    </Layout>
  );
}
