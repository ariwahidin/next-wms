import InboundTable from "./InboundTable";
import Layout from "@/components/layout";

export default function Page() {
  return (
    <Layout title="Inbound" subTitle="Inbound Data">
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-1">
        {/* <div className="justify-self-start">
          <Button onClick={() => {
            router.push("/wms/inbound/add");
          }}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
          <Button className="ml-2" onClick={() => {
            router.push("/wms/inbound/import");
          }}>
            <Upload className="mr-1 h-4 w-4" />
            Import
          </Button>
        </div> */}
        <InboundTable/>
      </div>
    </Layout>
  );
}
