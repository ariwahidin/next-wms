import Layout from "@/components/layout";
import PackingTable from "./PackingTable";

export default function Page() {
  return (
    <Layout title="Outbound" subTitle="Packing Order">
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-1">
        <PackingTable />
      </div>
    </Layout>
  );
}
