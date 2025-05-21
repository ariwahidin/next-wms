import React from "react";
import PermissionForm from "@/components/permission/PermissionForm";
import Title from "@/components/ui/title";
import eventBus from "@/utils/eventBus";
import router from "next/router";
import api from "@/lib/api";
import Layout from "@/components/layout";

const CreatePermissionPage = () => {
  const handleSubmit = async (data: { name: string; description: string }) => {
    const res = await api.post(
      "/permissions",
      {
        name: data.name,
        description: data.description,
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
      router.push("/configuration/permissions");
    }
  };

  return (
    <Layout title="Configuration" subTitle="Permissions">
      <div className="container mx-auto p-4">
        <Title>Create Permission</Title>
        <PermissionForm mode="create" onSubmit={handleSubmit} />
      </div>
    </Layout>
  );
};

export default CreatePermissionPage;
