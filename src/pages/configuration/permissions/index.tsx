/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Title from "@/components/ui/title";
import { useRouter } from "next/router";
import api from "@/lib/api";
import Layout from "@/components/layout";

const PermissionListPage = () => {
  const router = useRouter();
  const [permissions, setPermissions] = useState<any[]>([]);

  const fetchPermissions = async () => {
    try {
      const res = await api.get("/permissions", {
        withCredentials: true,
      });

      if (res.data.success) {
        setPermissions(res.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  return (

    <Layout title="Configuration" subTitle="Permissions">

    <div className="container mx-auto p-4">
      <Title>Permission List</Title>
      <Button onClick={() => router.push("/configuration/permissions/create")}>
        Create Permission
      </Button>
      <div className="mt-6">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Description</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((perm, index) => (
              <tr key={perm.ID}>
                <td className="border p-2">{index + 1}</td>
                <td className="border p-2">{perm.name}</td>
                <td className="border p-2">{perm.description}</td>
                <td className="border p-2">
                  <Button
                    onClick={() => router.push(`/configuration/permissions/edit/${perm.ID}`)}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    </Layout>
  );
};

export default PermissionListPage;
