import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "@/constants/navigation";
import { SpeakButton } from "@/components/ui/SpeakButton";
import styles from "./BottomNav.module.css";

export function BottomNav() {
  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <ul className={styles.list}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  isActive ? `${styles.link} ${styles.active}` : styles.link
                }
              >
                <Icon size={22} strokeWidth={2} />
                <span>{item.label}</span>
                <SpeakButton text={item.label} size="sm" stopPropagation asChild />
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
