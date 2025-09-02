import { useState } from "react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import LocationGenerator from "@/components/LocationGenerator";

export default function Page() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Layout title="Utilities" subTitle="Print ST Location">
      <div className="p-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Settings className="w-4 h-4 mr-2" />
          Generate Location
        </Button>

        <LocationGenerator
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </Layout>
  );
}
