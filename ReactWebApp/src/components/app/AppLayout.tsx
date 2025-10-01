import { PropsWithChildren } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";

export default function AppLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="min-h-dvh bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      <main className={isLoginPage ? "" : "container py-10"}>{children}</main>
    </div>
  );
}
