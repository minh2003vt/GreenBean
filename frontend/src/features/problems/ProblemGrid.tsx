import type { Problem } from "@/types";
import { ProblemCard } from "./ProblemCard";
import styles from "./ProblemGrid.module.css";

interface ProblemGridProps {
  problems: Problem[];
}

export function ProblemGrid({ problems }: ProblemGridProps) {
  return (
    <ul className={styles.grid}>
      {problems.map((problem) => (
        <li key={problem.id}>
          <ProblemCard problem={problem} />
        </li>
      ))}
    </ul>
  );
}
