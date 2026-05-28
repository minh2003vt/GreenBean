import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { SpeakableText } from "@/components/ui/SpeakableText";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import type { SolutionPhoto } from "@/types";
import styles from "./SolutionMediaModals.module.css";

interface VideoModalProps {
  title: string;
  videoUrl: string;
  onClose: () => void;
}

export function VideoModal({ title, videoUrl, onClose }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  useEffect(() => {
    if (embedUrl) return;
    videoRef.current?.play().catch(() => {});
    return () => videoRef.current?.pause();
  }, [embedUrl, videoUrl]);

  return (
    <Modal title={title} onClose={onClose}>
      {embedUrl ? (
        <iframe
          className={styles.embed}
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          className={styles.video}
          src={videoUrl}
          controls
          playsInline
          preload="metadata"
        />
      )}
    </Modal>
  );
}

interface AudioModalProps {
  title: string;
  videoUrl: string;
  onClose: () => void;
}

/** Same source as video, audio-only UI for farmers who prefer listening */
export function AudioModal({ title, videoUrl, onClose }: AudioModalProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const isVideoSource = Boolean(getYouTubeEmbedUrl(videoUrl)) || /\.(mp4|webm|mov)(\?|#|$)/i.test(videoUrl);
  const hint = isVideoSource ? "Audio-only file is not available for this step." : "Audio guide.";

  useEffect(() => {
    if (isVideoSource) return;
    audioRef.current?.play().catch(() => {});
    return () => audioRef.current?.pause();
  }, [isVideoSource, videoUrl]);

  return (
    <Modal title={title} onClose={onClose}>
      <SpeakableText text={hint} block size="sm">
        <p className={styles.audioHint}>{hint}</p>
      </SpeakableText>
      {isVideoSource ? (
        <p className={styles.audioHint}>This step has a video link. Please use Watch, or upload an MP3/audio file for Listen.</p>
      ) : (
        <audio ref={audioRef} className={styles.audio} src={videoUrl} controls preload="metadata" />
      )}
    </Modal>
  );
}

interface PhotoStepsModalProps {
  title: string;
  photos: SolutionPhoto[];
  onClose: () => void;
}

export function PhotoStepsModal({ title, photos, onClose }: PhotoStepsModalProps) {
  const [index, setIndex] = useState(0);
  const photo = photos[index];
  const total = photos.length;
  const stepLabel = `Step ${index + 1} of ${total}`;

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(total - 1, i + 1));

  return (
    <Modal title={title} onClose={onClose}>
      <div className={styles.gallery}>
        <div className={styles.galleryImageWrap}>
          <img src={photo.url} alt={photo.caption ?? ""} className={styles.galleryImage} />
        </div>
        <SpeakableText text={stepLabel} block size="sm">
          <p className={styles.stepLabel}>{stepLabel}</p>
        </SpeakableText>
        {photo.caption && (
          <SpeakableText text={photo.caption} block size="sm">
            <p className={styles.caption}>{photo.caption}</p>
          </SpeakableText>
        )}
        {photo.description && (
          <SpeakableText text={photo.description} block size="sm">
            <p className={styles.caption}>{photo.description}</p>
          </SpeakableText>
        )}
        <div className={styles.galleryNav}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={goPrev}
            disabled={index === 0}
            aria-label="Previous step"
          >
            <ChevronLeft size={20} />
          </button>
          <div className={styles.dots} aria-hidden>
            {photos.map((_, i) => (
              <span key={i} className={i === index ? styles.dotActive : styles.dot} />
            ))}
          </div>
          <button
            type="button"
            className={styles.navBtn}
            onClick={goNext}
            disabled={index === total - 1}
            aria-label="Next step"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </Modal>
  );
}
