import Layout from "@/components/layout";
import OrderTable from "../../order-spk/data/OrderTable";
export default function Page() {
  return (
    <Layout title="Outbound" subTitle="Shipping Order">
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-1">
        <OrderTable />
      </div>
    </Layout>
  );
}
