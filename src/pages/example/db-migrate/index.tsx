/* eslint-disable @typescript-eslint/no-unused-vars */
import { use, useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/layout";
import eventBus from "@/utils/eventBus";
import { ItemOptions } from "@/types/inbound";
import { BusinessUnit } from "@/types/bu";
import Select from "react-select";
import { Divide } from "lucide-react";
import { set } from "date-fns";

export default function Page() {
  const [dbName, setDbName] = useState("");
  const [message, setMessage] = useState("");
  const [buOptions, setBuOptions] = useState<ItemOptions[]>([]);
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState([]);

  const fetchData = async () => {
    try {
      const response = await api.get("/configurations/get-all-bu", {
        withCredentials: true,
      });
      console.log(response.data);

      if (response.data.success) {
        setLoading(false);
        setBuOptions(
          response.data.data.map((item: BusinessUnit) => ({
            value: item.db_name,
            label: item.db_name,
          }))
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getTable = async (db: string) => {
    try {
      const response = await api.post(
        "/configurations/get-all-table",
        {
          dbName: db,
        },
        {
          withCredentials: true,
        }
      );
      console.log(response.data);

      if (response.data.success) {
        setLoading(false);
        setTables(response.data.data.tables);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log(dbName);
    setLoading(true);

    try {
      const response = await api.post(
        "/configurations/db-migrate",
        {
          dbName,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setLoading(false);
        eventBus.emit("showAlert", {
          title: "Success",
          description: response.data.message,
          type: "success",
        });

        getTable(dbName);
      }
    } catch (error) {
      console.error(error);
    } finally {
      // setDbName("");
    }
  };

  return (
    <Layout title="Business Unit" subTitle="Create DB">
      {loading && (
        <div className="absolute top-0 left-0 w-full h-full bg-gray-500 opacity-50 z-10">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-2xl">
            Loading...
          </div>
        </div>
      )}

      {!loading && (
        <div style={{ padding: "2rem" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="dbName">Database Name:</label>
              <Select
                value={buOptions.find((option) => option.value === dbName)}
                options={buOptions}
                onChange={(selectedOption) => {
                  setDbName(selectedOption.value);
                  getTable(selectedOption.value);
                }}
              />
            </div>

            <Button className="w-full" type="submit">
              Migrate
            </Button>
          </form>
          
          {message && <p>{message}</p>}

          <div style={{ marginTop: "2rem" }}>
            <h2>Tables:</h2>
            <ul>
              {tables.map((table) => (
                <li key={table}>{table}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Layout>
  );
}
