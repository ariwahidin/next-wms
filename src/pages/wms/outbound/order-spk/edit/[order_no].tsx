import ManualForm from "@/components/order-spk/ManualForm";
import Layout from "@/components/layout";
import { useRouter } from "next/router";

export default function EditPage() {
  const router = useRouter();
  const { order_no } = router.query;
  if (!order_no) return null;
  return  (
    <Layout title="Order SPK" titleLink="#" subTitle={order_no}>
      <ManualForm />
    </Layout>
  );
}
