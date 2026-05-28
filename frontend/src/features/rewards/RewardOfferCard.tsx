import { Gift } from "lucide-react";
import type { RewardOffer } from "@/types";
import { SpeakableText } from "@/components/ui/SpeakableText";
import styles from "./RewardOfferCard.module.css";

interface RewardOfferCardProps {
  reward: RewardOffer;
}

export function RewardOfferCard({ reward }: RewardOfferCardProps) {
  return (
    <section className={styles.card}>
      <SpeakableText text="Rewards You Can Get" rowClassName={styles.headingRow} block size="sm">
        <h2 className={styles.heading}>
          <Gift size={18} aria-hidden />
          Rewards You Can Get
        </h2>
      </SpeakableText>
      <div className={styles.body}>
        <div className={styles.badge} aria-hidden>
          💵
        </div>
        <div>
          <SpeakableText text={reward.title} block size="sm">
            <h3 className={styles.title}>{reward.title}</h3>
          </SpeakableText>
          <SpeakableText text={reward.description} block size="sm">
            <p className={styles.description}>{reward.description}</p>
          </SpeakableText>
        </div>
      </div>
    </section>
  );
}
