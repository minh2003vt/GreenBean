import { BarChart3, BookOpen, Camera, ClipboardList, Sprout, Wallet } from "lucide-react";
import type { ChallengeProgress, ChallengeProgressStep } from "@/types";
import { SpeakableText } from "@/components/ui/SpeakableText";
import styles from "./ProgressCard.module.css";

const STEP_ICONS = {
  learn: BookOpen,
  try: Sprout,
  picture: Camera,
  review: ClipboardList,
  reward: Wallet,
} as const;

interface ProgressCardProps {
  progress: ChallengeProgress;
}

function StepIcon({ step }: { step: ChallengeProgressStep }) {
  const Icon = STEP_ICONS[step.id as keyof typeof STEP_ICONS] ?? Sprout;
  const statusClass =
    step.status === "done"
      ? styles.stepDone
      : step.status === "current"
        ? styles.stepCurrent
        : styles.stepPending;

  return (
    <div className={`${styles.step} ${statusClass}`}>
      <span className={styles.stepCircle}>
        <Icon size={14} />
      </span>
      <SpeakableText
        text={step.label}
        rowClassName={styles.stepSpeakRow}
        align="center"
        size="sm"
      >
        <span className={styles.stepLabel}>{step.label}</span>
      </SpeakableText>
    </div>
  );
}

export function ProgressCard({ progress }: ProgressCardProps) {
  const percentText = `${progress.percent} percent`;
  const stepsText = `${progress.completedSteps} of ${progress.totalSteps} steps completed`;

  return (
    <section className={styles.card}>
      <SpeakableText text="My Challenge Progress" rowClassName={styles.headingRow} block size="sm">
        <h2 className={styles.heading}>
          <BarChart3 size={18} aria-hidden />
          My Challenge Progress
        </h2>
      </SpeakableText>
      <div className={styles.body}>
        <div className={styles.stats}>
          <SpeakableText text={percentText} block size="sm">
            <p className={styles.percent}>{progress.percent}%</p>
          </SpeakableText>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <SpeakableText text={stepsText} block size="sm">
            <p className={styles.stepsText}>{stepsText}</p>
          </SpeakableText>
        </div>
        <div className={styles.tracker}>
          {progress.steps.map((step) => (
            <StepIcon key={step.id} step={step} />
          ))}
        </div>
      </div>
    </section>
  );
}
