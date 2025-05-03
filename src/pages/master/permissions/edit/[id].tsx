/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import PermissionForm from "@/components/permission/PermissionForm";
import Title from "@/components/ui/title";
import { useRouter } from "next/router";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";
import Layout from "@/components/layout";

const EditPermissionPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [permissionData, setPermissionData] = useState<any>(null);

  const handleSubmit = (data: any) => {
    api
      .put(`/permissions/${id}`, data, {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.success) {
          eventBus.emit("showAlert", {
            title: "Success!",
            description: res.data.message,
            type: "success",
          });
          router.push("/master/permissions");
        }
      });
  };

  useEffect(() => {
    if (!id) return;
    const fetchPermissionData = async () => {
      try {
        const res = await api.get(`/permissions/${id}`, {
          withCredentials: true,
        });
        if (res.data.success) {
          setPermissionData(res.data.data);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchPermissionData();
  }, [id]);

  return (

    <Layout title="Master" subTitle="Permission">

    <div className="container mx-auto p-4">
      <Title>Edit Permission</Title>
      {permissionData && (
        <PermissionForm
          mode="edit"
          initialData={permissionData}
          onSubmit={handleSubmit}
        />
      )}
    </div>

    </Layout>
  );
};

export default EditPermissionPage;
