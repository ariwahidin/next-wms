import ManualForm from "@/components/order-spk/ManualForm";
import Layout from "@/components/layout";
import { useRouter } from "next/router";

export default function EditPage() {
  const router = useRouter();
  const { order_no } = router.query;
  if (!order_no) return null;
  const orderNo = Array.isArray(order_no) ? order_no[0] : order_no;
  return  (
    <Layout title="Order SPK" titleLink="#" subTitle={orderNo}>
      <ManualForm />
    </Layout>
  );
}
