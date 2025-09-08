import api from "@/lib/api";
import { CreateMainVasPayload, MainVas } from "@/types/mainVas";

export async function fetchMainVas(): Promise<MainVas[]> {
  const res = await api.get("/vas/main-vas");
  return res.data.data;
}

export async function createMainVas(payload: CreateMainVasPayload) {
  const res = await api.post("/vas/main-vas", payload);
  return res.data;
}

export async function updateMainVas(id: number, payload: Partial<CreateMainVasPayload>) {
  const res = await api.put(`/vas/main-vas/${id}`, payload);
  return res.data;
}
