import { useState } from "react";
import { Headphones, ImageIcon, Play } from "lucide-react";
import type { SolutionStep } from "@/types";
import { SpeakableText } from "@/components/ui/SpeakableText";
import { SpeakButton } from "@/components/ui/SpeakButton";
import {
  AudioModal,
  PhotoStepsModal,
  VideoModal,
} from "@/features/problems/SolutionMediaModals";
import styles from "./SolutionCard.module.css";

type OpenModal = "watch" | "listen" | "photos" | null;

interface SolutionCardProps {
  step: SolutionStep;
  index: number;
}

export function SolutionCard({ step, index }: SolutionCardProps) {
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const { media } = step;
  const hasVideo = Boolean(media?.videoUrl);
  const hasAudio = Boolean(media?.audioUrl ?? media?.videoUrl);
  const hasPhotos = Boolean(media?.photos?.length);
  const modalTitle = `${index + 1}. ${step.title}`;

  return (
    <>
      <article className={styles.card}>
        <div className={styles.top}>
          <span className={styles.number} aria-hidden>
            {index + 1}
          </span>
          <div className={styles.text}>
            <SpeakableText text={step.title} block size="sm" rowClassName={styles.speakRow}>
              <h2 className={styles.title}>{step.title}</h2>
            </SpeakableText>
            <SpeakableText
              text={step.description}
              block
              size="sm"
              rowClassName={styles.speakRow}
            >
              <p className={styles.description}>{step.description}</p>
            </SpeakableText>
          </div>
          <img src={step.imageUrl} alt="" className={styles.thumb} loading="lazy" />
        </div>

        <div className={styles.actions}>
          <div className={styles.actionCell}>
            <button
              type="button"
              className={`${styles.action} ${styles.watch}`}
              disabled={!hasVideo}
              onClick={() => setOpenModal("watch")}
            >
              <Play size={16} fill="currentColor" />
              <span>Watch</span>
            </button>
            <SpeakButton text="Watch" size="sm" className={styles.actionSpeak} />
          </div>
          <div className={styles.actionCell}>
            <button
              type="button"
              className={`${styles.action} ${styles.listen}`}
              disabled={!hasAudio}
              onClick={() => setOpenModal("listen")}
            >
              <Headphones size={16} />
              <span>Listen</span>
            </button>
            <SpeakButton text="Listen" size="sm" className={styles.actionSpeak} />
          </div>
          <div className={styles.actionCell}>
            <button
              type="button"
              className={`${styles.action} ${styles.photos}`}
              disabled={!hasPhotos}
              onClick={() => setOpenModal("photos")}
            >
              <ImageIcon size={16} />
              <span>See photos</span>
            </button>
            <SpeakButton text="See photos" size="sm" className={styles.actionSpeak} />
          </div>
        </div>
      </article>

      {openModal === "watch" && media?.videoUrl && (
        <VideoModal
          title={modalTitle}
          videoUrl={media.videoUrl}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "listen" && (media?.audioUrl || media?.videoUrl) && (
        <AudioModal
          title={modalTitle}
          videoUrl={media.audioUrl ?? media.videoUrl}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "photos" && media?.photos && (
        <PhotoStepsModal
          title={modalTitle}
          photos={media.photos}
          onClose={() => setOpenModal(null)}
        />
      )}
    </>
  );
}
