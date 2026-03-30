import type { ReactNode } from "react";
import AppSidebar from "../components/AppSidebar";
import AppTopbar from "../components/AppTopbar";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f7f7f7" }}>
      <AppSidebar />

      <div
        style={{
          marginLeft: "220px",
          width: "calc(100% - 220px)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <AppTopbar />

        <main
          style={{
            flex: 1,
            padding: "24px",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}