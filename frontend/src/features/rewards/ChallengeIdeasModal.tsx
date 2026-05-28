import { Modal } from "@/components/ui/Modal";
import { SpeakableText } from "@/components/ui/SpeakableText";
import type { MonthlyChallenge } from "@/types";
import styles from "./ChallengeIdeasModal.module.css";

interface ChallengeIdeasModalProps {
  challenge: MonthlyChallenge;
  onClose: () => void;
}

export function ChallengeIdeasModal({ challenge, onClose }: ChallengeIdeasModalProps) {
  const deadlineText = `Challenge ends in ${challenge.daysRemaining} days. ${challenge.endDateLabel}`;

  return (
    <Modal title={challenge.posterLabel} onClose={onClose} wide>
      <div className={styles.zoom}>
        <img src={challenge.imageUrl} alt="" className={styles.image} />
        <SpeakableText
          text={challenge.title}
          rowClassName={styles.titleRow}
          align="center"
          block
          size="sm"
        >
          <h3 className={styles.challengeTitle}>{challenge.title}</h3>
        </SpeakableText>
      </div>
      <SpeakableText text={challenge.ideasDetail} block size="sm">
        <p className={styles.detail}>{challenge.ideasDetail}</p>
      </SpeakableText>
      <ul className={styles.list}>
        {challenge.ideasBullets.map((item) => (
          <li key={item}>
            <SpeakableText text={item} block size="sm">
              {item}
            </SpeakableText>
          </li>
        ))}
      </ul>
      <SpeakableText text={deadlineText} block size="sm">
        <p className={styles.deadline}>{deadlineText}</p>
      </SpeakableText>
    </Modal>
  );
}
