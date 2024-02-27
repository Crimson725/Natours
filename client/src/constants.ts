export const SERVER_URL =
  import.meta.env.MODE === "production"
    ? "backendapp"
    : "http://localhost:3000";
