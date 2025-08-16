/* eslint-disable @typescript-eslint/no-unused-vars */
import OutboundTable from "./OutboundTable";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { Plus } from "lucide-react";

export default function Page() {
  const router = useRouter();
  return (
    <Layout title="Handling Outbound" subTitle="Handling Outbound Data">
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-1">
        <div className="absolute left-4 top-30 z-10 flex items-center space-x-2">
          {/* <Button
            onClick={() => {
              router.push("/wms/outbound/add");
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button> */}
        </div>
        <OutboundTable />
      </div>
    </Layout>
  );
}
