/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import RoleForm from "@/components/role/RoleForm";
import Title from "@/components/ui/title";
import { useRouter } from "next/router";
import Layout from "@/components/layout";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";

const EditRolePage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [roleData, setRoleData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      // fetch(`/api/roles/${id}`)
      //   .then((res) => res.json())
      //   .then((data) => setRoleData(data));
      api
        .get(`/roles/${id}`, {
          withCredentials: true,
        })
        .then((res) => {
          if (res.data.success) {
            setRoleData(res.data.data);
          }
        })
        .catch((error) => {
          console.error("Error fetching role data:", error);
        });
    } else {
      setRoleData({
        name: "",
      })
    }
  }, [id]);

  const handleSubmit = async (data: { name: string }) => {
    const res = await api.put(
      `/roles/${id}`,
      {
        name: data.name,
      },
      {
        withCredentials: true,
      }
    );

    if (res.data.success) {
      eventBus.emit("showAlert", {
        title: "Success!",
        description: res.data.message,
        type: "success",
      });
      router.push("/wms/settings/role");
    }
  }

  if (!roleData) {
    return <div>Loading...</div>;
  }

  return (
    <Layout title="Master" subTitle="Role">
      <div className="container mx-auto p-4">
        <Title>Edit Role</Title>
        {roleData && (
          <RoleForm mode="edit" roleData={roleData} onSubmit={handleSubmit} />
        )}
      </div>
    </Layout>
  );
};

export default EditRolePage;
