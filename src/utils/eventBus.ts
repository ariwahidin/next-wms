import mitt from "mitt";

// type Events = {
//   showAlert: { title: string; description?: string; type?: "error" | "success" | "info" };
//   loading: boolean;
// };

type Events = {
  showAlert: { title: string; description?: string; type?: "error" | "success" | "info" };
  loading: boolean;
  refreshData: void; // atau bisa juga pakai parameter kalau perlu
};

const eventBus = mitt<Events>();

export default eventBus;
