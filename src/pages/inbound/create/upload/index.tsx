import UploadForm from "@/components/inbound/create/UploadForm";
import Layout from "@/components/layout";

export default function UploadPage() {
  return (
    <Layout title="Inbound" subTitle="Upload">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-4">Upload Inbound Excel</h1>
        <UploadForm />
      </div>
    </Layout>
  );
}
