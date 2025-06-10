/* eslint-disable @typescript-eslint/no-unused-vars */
import { use, useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/layout";
import eventBus from "@/utils/eventBus";
import { BusinessUnit } from "@/types/bu";

export default function Page() {
  const [dbName, setDbName] = useState("");
  const [message, setMessage] = useState("");
  const [allBu, setAllBu] = useState<BusinessUnit[]>([]);

  const fetchData = async () => {
    try {
      const response = await api.get("/configurations/get-all-bu", {
        withCredentials: true,
      });
      if (response.data.success) {
        setAllBu(response.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post(
        "/configurations/create-db",
        {
          dbName,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        eventBus.emit("showAlert", {
          title: "Success",
          description: response.data.message,
          type: "success",
        });

        fetchData();
      }
    } catch (error) {
      console.error(error);
    } finally {
      // setDbName("");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Layout title="Business Unit" subTitle="Create DB">
      <div style={{ padding: "2rem" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="dbName">Database Name:</label>
            <Input
              type="text"
              placeholder="Database Name"
              value={dbName}
              onChange={(e) => {
                // ambil value input
                let val = e.target.value;
                // ubah ke huruf kecil
                val = val.toLowerCase();
                // ganti spasi dengan underscore
                val = val.replace(/\s+/g, "_");
                // filter hanya huruf a-z, angka 0-9, dan underscore
                val = val.replace(/[^a-z0-9_]/g, "");
                setDbName(val);
              }}
            />
          </div>

          <Button className="w-full" type="submit">
            Create
          </Button>
        </form>
        {message && <p>{message}</p>}
      </div>
      <div style={{ padding: "2rem" }}>
        <h2>All Business Unit</h2>
        <ul>
          {allBu.map((bu) => (
            <li key={bu.db_name}>{bu.db_name}</li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
