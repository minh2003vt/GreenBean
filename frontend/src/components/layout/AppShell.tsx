import { Outlet, useLocation } from "react-router-dom";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import styles from "./AppShell.module.css";

export function AppShell() {
  const { pathname } = useLocation();
  const isProblemDetail = pathname.startsWith("/problems/");

  const contentClass = isProblemDetail
    ? `${styles.content} ${styles.contentDetail}`
    : styles.content;

  return (
    <div className={styles.shell}>
      <div className={styles.frame}>
        {!isProblemDetail && <TopBar />}
        <main className={styles.main}>
          <div className={contentClass}>
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
