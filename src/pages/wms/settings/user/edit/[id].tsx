// pages/master/user/[id]/edit.tsx
import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; // gunakan ini untuk Next.js App Router
import Layout from "@/components/layout";
import Title from "@/components/ui/title";
import api from "@/lib/api";
import UserForm from "@/components/user/UserForm";

const EditUserPage = () => {
  const params = useParams();
  const userId = params?.id;
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (userId) {
      api.get(`/users/${userId}`, { withCredentials: true }).then((res) => {
        setUserData(res.data);
      });
    }
  }, [userId]);

  if (!userData) return <p>Loading...</p>;

  return (
    <Layout title="Master" subTitle="User">
      <div className="container mx-auto p-4">
        <Title>Edit User</Title>
        <UserForm mode="edit" userData={userData} />
      </div>
    </Layout>
  );
};

export default EditUserPage;
