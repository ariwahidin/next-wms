"use client";

import React from "react";
import { useRouter } from "next/navigation";
import RoleForm from "@/components/role/RoleForm";
import Title from "@/components/ui/title"; // Jika belum ada, bisa dibuat sederhana
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";
import Layout from "@/components/layout";

const CreateRolePage = () => {
  const router = useRouter();

  const handleSubmit = async (data: { name: string }) => {
    const res = await api.post(
      "/roles",
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
      router.push("/master/role");
    }
  };

  return (
    <Layout title="Master" subTitle="Role">
      <div className="container mx-auto p-4">
        <Title>Create Role</Title>
        <RoleForm mode="create" onSubmit={handleSubmit} />
      </div>
    </Layout>
  );
};

export default CreateRolePage;
