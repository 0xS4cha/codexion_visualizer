import { RouterProvider } from "react-router-dom";
import { router } from "@/lib/router";

export default function App() {
  return <RouterProvider router={router} />;
}