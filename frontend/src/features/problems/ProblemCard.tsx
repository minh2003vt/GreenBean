import { Link } from "react-router-dom";
import type { ProblemCategory } from "@/types";
import { SpeakableText } from "@/components/ui/SpeakableText";
import styles from "./ProblemCard.module.css";

interface ProblemCardProps {
  problem: ProblemCategory;
}

export function ProblemCard({ problem }: ProblemCardProps) {
  const Icon = problem.icon;

  return (
    <Link to={`/problems/${problem.slug}`} className={styles.card}>
      <div className={styles.imageWrap}>
        <img src={problem.imageUrl} alt="" className={styles.image} loading="lazy" />
        <span className={styles.badge} aria-hidden>
          <Icon size={18} strokeWidth={2.25} />
        </span>
      </div>
      <div className={styles.labelRow}>
        <SpeakableText
          text={problem.label}
          rowClassName={styles.labelSpeakRow}
          align="center"
          block
          size="sm"
        >
          <span className={styles.label}>{problem.label}</span>
        </SpeakableText>
      </div>
    </Link>
  );
}
