import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ProblemDetailHeader } from "@/features/problems/ProblemDetailHeader";
import { SolutionCard } from "@/features/problems/SolutionCard";
import { SpeakableText } from "@/components/ui/SpeakableText";
import { api } from "@/lib/api";
import { mapProblem } from "@/lib/problemMapping";
import type { Problem } from "@/types";
import styles from "./ProblemDetailPage.module.css";

export function ProblemDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.problem(slug)
      .then((item) => setProblem(mapProblem(item)))
      .catch(() => setProblem(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return null;

  if (!problem) {
    return (
      <div className={`page-stack ${styles.page}`}>
        <SpeakableText text="Problem not found." rowClassName={styles.notFoundRow} block>
          <p className={styles.notFound}>Problem not found.</p>
        </SpeakableText>
        <SpeakableText text="Back to home" rowClassName={styles.notFoundRow} block>
          <Link to="/" className={styles.notFoundLink}>
            Back to home
          </Link>
        </SpeakableText>
      </div>
    );
  }

  return (
    <div className={`page-stack ${styles.page}`}>
      <ProblemDetailHeader title={problem.label} />

      <section className={styles.hero} aria-labelledby="hero-text">
        <img src={problem.imageUrl} alt="" className={styles.heroImage} />
        <div className={styles.heroTextWrap}>
          <SpeakableText
            text={problem.heroText}
            rowClassName={styles.heroTextRow}
            block
            size="sm"
            variant="onDark"
          >
            <p id="hero-text" className={styles.heroText}>
              {problem.heroText}
            </p>
          </SpeakableText>
        </div>
      </section>

      <ol className={styles.solutions}>
        {problem.solutions.map((step, index) => (
          <li key={step.id} className={styles.solutionItem}>
            <SolutionCard step={step} index={index} />
          </li>
        ))}
      </ol>
    </div>
  );
}
