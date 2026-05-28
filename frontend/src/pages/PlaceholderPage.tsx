import type { ReactNode } from "react";
import { SpeakableText } from "@/components/ui/SpeakableText";
import styles from "./PlaceholderPage.module.css";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
  return (
    <div className={`page-stack ${styles.page}`}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <SpeakableText
        text={title}
        rowClassName={styles.textRow}
        align="center"
        block
      >
        <h1 className={styles.title}>{title}</h1>
      </SpeakableText>
      <SpeakableText
        text={description}
        rowClassName={styles.textRow}
        align="center"
        block
      >
        <p className={styles.description}>{description}</p>
      </SpeakableText>
    </div>
  );
}
