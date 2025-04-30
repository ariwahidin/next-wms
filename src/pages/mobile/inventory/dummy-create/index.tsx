import { useState } from "react";
import api from "@/lib/api";

const InsertDummyPage = () => {
  const [count, setCount] = useState<number>(0);
  const [current, setCurrent] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const handleInsert = async () => {
    setIsLoading(true);
    setCurrent(0);
    setMessage("");
    for (let i = 1; i <= count; i++) {
      try {
        const response = await api.post("/mobile/inventory/dummy?count=80", {},{withCredentials: true});
        if (response.data.success) {
          setCurrent(i);
        } else {
          setMessage("Insert gagal di loop ke-" + i);
          break;
        } 
      } catch (error) {
        console.error(error);
        setMessage("Terjadi error di loop ke-" + i);
        break;
      }
    }
    setIsLoading(false);
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
      <h1>Insert Dummy Data</h1>
      <input
        type="number"
        value={count}
        onChange={(e) => setCount(Number(e.target.value))}
        placeholder="Masukkan jumlah insert"
        className="form-control mb-3"
        style={{ padding: "8px", width: "100%" }}
      />
      <button
        onClick={handleInsert}
        disabled={isLoading || count <= 0}
        className="btn btn-primary"
        style={{ width: "100%", padding: "10px", backgroundColor: "green", color: "white" }}
      >
        {isLoading ? "Loading..." : "Insert"}
      </button>

      {current > 0 && (
        <p style={{ marginTop: "20px" }}>
          Insert ke {current} dari {count}
        </p>
      )}

      {message && (
        <p style={{ marginTop: "20px", color: "red" }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default InsertDummyPage;
