import { RouterProvider } from "react-router-dom";
import { router } from "@/lib/router";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}