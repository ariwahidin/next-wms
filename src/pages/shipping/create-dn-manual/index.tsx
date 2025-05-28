import Layout from "@/components/layout";
import DnForm from "@/components/shipping/create-dn-manual/DNForm";

export default function CreateDNPage() {
  return (
    <Layout title="Shipping" subTitle="Create DN Manual">
        <DnForm />
    </Layout>
  );
}
