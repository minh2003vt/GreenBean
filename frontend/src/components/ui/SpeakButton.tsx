import { Volume2 } from "lucide-react";
import { useCallback, type MouseEvent } from "react";
import styles from "./SpeakButton.module.css";

interface SpeakButtonProps {
  text: string;
  className?: string;
  size?: "sm" | "md";
  variant?: "surface" | "primary" | "onDark";
  stopPropagation?: boolean;
  asChild?: boolean;
}

export function SpeakButton({
  text,
  className,
  size = "md",
  variant = "surface",
  stopPropagation = false,
  asChild = false,
}: SpeakButtonProps) {
  const handleSpeak = useCallback(
    (e: MouseEvent<HTMLButtonElement | HTMLSpanElement>) => {
      if (stopPropagation) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (typeof window === "undefined") return;
      const synth = window.speechSynthesis;
      if (!synth || typeof SpeechSynthesisUtterance === "undefined") return;

      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      synth.speak(utterance);
    },
    [text, stopPropagation],
  );

  const btnClass = [
    styles.btn,
    styles[variant],
    styles[size],
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const iconSize = size === "sm" ? 14 : 16;

  if (asChild) {
    return (
      <span
        role="button"
        tabIndex={0}
        className={btnClass}
        aria-label={`Read aloud: ${text}`}
        onClick={handleSpeak}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleSpeak(e as unknown as MouseEvent<HTMLSpanElement>);
        }}
        title="Read aloud"
      >
        <Volume2 size={iconSize} />
      </span>
    );
  }

  return (
    <button
      type="button"
      className={btnClass}
      aria-label={`Read aloud: ${text}`}
      onClick={handleSpeak}
      title="Read aloud"
    >
      <Volume2 size={iconSize} />
    </button>
  );
}
