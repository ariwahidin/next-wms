import ProductTable from "./ProductTable";
import Layout from "@/components/layout";
export default function Page() {
  return (
    <Layout title="Master" subTitle="Items">
      <div className="p-6 space-y-6">
        <div className="col-span-2">
          <ProductTable />
        </div>
      </div>
    </Layout>
  );
}
