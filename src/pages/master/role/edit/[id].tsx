import React, { useEffect, useState } from "react";
import RoleForm from "@/components/role/RoleForm";
import Title from "@/components/ui/title";
import { useRouter } from "next/router";
import Layout from "@/components/layout";

const EditRolePage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [roleData, setRoleData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/roles/${id}`)
        .then((res) => res.json())
        .then((data) => setRoleData(data));
    }
  }, [id]);

  return (
    <Layout title="Master" subTitle="Role">
      <div className="container mx-auto p-4">
        <Title>Edit Role</Title>
        {roleData && (
          <RoleForm mode="edit" roleData={roleData} onSubmit={() => {}} />
        )}
      </div>
    </Layout>
  );
};

export default EditRolePage;
