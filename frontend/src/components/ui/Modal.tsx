import { useEffect, useId, type ReactNode } from "react";
import { X } from "lucide-react";
import { SpeakableText } from "@/components/ui/SpeakableText";
import styles from "./Modal.module.css";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

export function Modal({ title, onClose, children, wide }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={wide ? `${styles.dialog} ${styles.dialogWide}` : styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <SpeakableText text={title} rowClassName={styles.titleRow} block size="sm">
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
          </SpeakableText>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
