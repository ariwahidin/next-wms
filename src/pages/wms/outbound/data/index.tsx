import OutboundTable from "./OutboundTable";
import Layout from "@/components/layout";

export default function Page() {
  return (
    <Layout title="Outbound" subTitle="Outbound Activity">
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-1">
        <OutboundTable />
      </div>
    </Layout>
  );
}
