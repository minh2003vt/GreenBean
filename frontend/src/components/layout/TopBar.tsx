import { Globe, Sprout } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/constants/navigation";
import { SpeakableText } from "@/components/ui/SpeakableText";
import { SpeakButton } from "@/components/ui/SpeakButton";
import styles from "./TopBar.module.css";

export function TopBar() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logo} aria-hidden>
          <Sprout size={22} strokeWidth={2.25} />
        </div>
        <div className={styles.brandText}>
          <SpeakableText text={APP_NAME} rowClassName={styles.brandRow} size="sm">
            <span className={styles.name}>{APP_NAME}</span>
          </SpeakableText>
          <SpeakableText text={APP_TAGLINE} rowClassName={styles.brandRow} size="sm">
            <span className={styles.tagline}>{APP_TAGLINE}</span>
          </SpeakableText>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.langBtn} aria-label="Change language">
          <Globe size={18} />
          <span>Language</span>
          <SpeakButton text="Language" size="sm" stopPropagation asChild />
        </button>
      </div>
    </header>
  );
}
