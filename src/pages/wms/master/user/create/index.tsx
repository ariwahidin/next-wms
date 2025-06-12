import React from "react";
import UserForm from "@/components/user/UserForm";
import Title from "@/components/ui/title";
import Layout from "@/components/layout";

const CreateUserPage = () => {
  return (
    <Layout title="Master" subTitle="User">
      <div className="container mx-auto p-4">
        <Title>Create User</Title>
        <UserForm mode="create" />
      </div>
    </Layout>
  );
};

export default CreateUserPage;
