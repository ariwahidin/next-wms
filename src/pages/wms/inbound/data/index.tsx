import InboundTable from "./InboundTable";
import Layout from "@/components/layout";

export default function Page() {
  return (
    <Layout title="Inbound" subTitle="Inbound Activity">
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-1">
        <InboundTable/>
      </div>
    </Layout>
  );
}
