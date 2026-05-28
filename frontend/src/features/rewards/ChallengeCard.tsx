import { Calendar, ChevronRight, Sprout } from "lucide-react";
import type { MonthlyChallenge } from "@/types";
import { SpeakableText } from "@/components/ui/SpeakableText";
import { SpeakButton } from "@/components/ui/SpeakButton";
import styles from "./ChallengeCard.module.css";

interface ChallengeCardProps {
  challenge: MonthlyChallenge;
  onSeeIdeas: () => void;
}

export function ChallengeCard({ challenge, onSeeIdeas }: ChallengeCardProps) {
  const deadlineTitle = `Challenge ends in ${challenge.daysRemaining} Days`;

  return (
    <section className={styles.card}>
      <div className={styles.top}>
        <div className={styles.poster}>
          <SpeakableText
            text={challenge.posterLabel}
            rowClassName={styles.posterLabelRow}
            align="center"
            block
            size="sm"
            variant="onDark"
          >
            <span className={styles.posterLabel}>{challenge.posterLabel}</span>
          </SpeakableText>
          <img src={challenge.imageUrl} alt="" className={styles.posterImage} />
        </div>
        <div className={styles.main}>
          <Sprout size={18} className={styles.icon} aria-hidden />
          <SpeakableText text={challenge.title} block size="sm">
            <h2 className={styles.title}>{challenge.title}</h2>
          </SpeakableText>
        </div>
        <div className={styles.deadline}>
          <SpeakableText text={deadlineTitle} block size="sm">
            <p className={styles.deadlineTitle}>{deadlineTitle}</p>
          </SpeakableText>
          <SpeakableText text={challenge.endDateLabel} block size="sm">
            <p className={styles.deadlineDate}>
              <Calendar size={12} aria-hidden />
              {challenge.endDateLabel}
            </p>
          </SpeakableText>
        </div>
      </div>

      <div className={styles.flow}>
        {challenge.flowSteps.map((step, i) => (
          <span key={step.id} className={styles.flowItem}>
            <span className={styles.flowDot} />
            <SpeakableText text={step.label} size="sm">
              <span className={styles.flowLabel}>{step.label}</span>
            </SpeakableText>
            {i < challenge.flowSteps.length - 1 && (
              <span className={styles.flowArrow} aria-hidden>
                →
              </span>
            )}
          </span>
        ))}
      </div>

      <button type="button" className={styles.cta} onClick={onSeeIdeas}>
        See Challenge Ideas
        <ChevronRight size={18} />
        <SpeakButton text="See Challenge Ideas" size="sm" variant="onDark" stopPropagation asChild />
      </button>
    </section>
  );
}
