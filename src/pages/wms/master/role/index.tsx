/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Title from "@/components/ui/title";
import { useRouter } from "next/router";
import api from "@/lib/api";
import Layout from "@/components/layout";

const RoleListPage = () => {
  const router = useRouter();
  const [roles, setRoles] = useState<any[]>([]);

  const fetchRoles = async () => {
    try {
      const res = await api.get("/roles", {
        withCredentials: true,
      });

      if (res.data.success) {
        setRoles(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <Layout title="Master" subTitle="Role">
      <div className="container mx-auto p-4">
        <Title>Role List</Title>
        <Button onClick={() => router.push("/master/role/create")}>
          Create Role
        </Button>
        <div className="mt-6">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr>
                <th className="border p-2">ID</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role, index) => (
                <tr key={role.ID}>
                  <td className="border p-2">{index + 1}</td>
                  <td className="border p-2">{role.name}</td>
                  <td className="border p-2">
                    <Button
                      onClick={() => router.push(`/master/role/edit/${role.ID}`)}
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

export default RoleListPage;
