import mitt from "mitt";

type Events = {
  showAlert: { title: string; description?: string; type?: "error" | "success" | "info" };
  loading: boolean;
};

const eventBus = mitt<Events>();

export default eventBus;
