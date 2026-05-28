import { useEffect, useState } from "react";
import { ContactButton } from "@/components/ContactButton";
import { ProblemGrid } from "@/features/problems/ProblemGrid";
import { SpeakableText } from "@/components/ui/SpeakableText";
import { api } from "@/lib/api";
import { mapProblem } from "@/lib/problemMapping";
import type { Problem } from "@/types";
import styles from "./HomePage.module.css";

export function HomePage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.problems()
      .then((items) => setProblems(items.map(mapProblem)))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load problems"));
  }, []);

  return (
    <div className={`page-stack page-stack--fill ${styles.page}`}>
      <header className={styles.hero}>
        <SpeakableText
          text="What is your problem today?"
          rowClassName={styles.textRow}
          align="center"
          block
        >
          <h1 className={styles.title}>What is your problem today?</h1>
        </SpeakableText>

        <SpeakableText
          text="Tap a problem to get simple solutions"
          rowClassName={styles.textRow}
          align="center"
          block
        >
          <p className={styles.subtitle}>
            <span aria-hidden>👇</span> Tap a problem to get simple solutions
          </p>
        </SpeakableText>
      </header>

      {error ? <p>{error}</p> : <ProblemGrid problems={problems} />}

      <ContactButton className={styles.contact} />
    </div>
  );
}
