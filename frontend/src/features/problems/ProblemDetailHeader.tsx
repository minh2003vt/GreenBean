import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { SpeakableText } from "@/components/ui/SpeakableText";
import styles from "./ProblemDetailHeader.module.css";

interface ProblemDetailHeaderProps {
  title: string;
}

export function ProblemDetailHeader({ title }: ProblemDetailHeaderProps) {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.back} aria-label="Back to problems">
        <ChevronLeft size={22} strokeWidth={2.25} />
      </Link>
      <SpeakableText
        text={title}
        rowClassName={styles.titleRow}
        align="center"
        block
        size="sm"
      >
        <h1 className={styles.title}>{title}</h1>
      </SpeakableText>
    </header>
  );
}
