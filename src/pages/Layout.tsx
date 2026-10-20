import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { trackVisit } from "@/lib/analytics";

export default function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    trackVisit(pathname);
  }, [pathname]);

  return <Outlet />;
}
