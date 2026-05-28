import type { ReactNode } from "react";
import { SpeakButton } from "@/components/ui/SpeakButton";
import styles from "./SpeakableText.module.css";

interface SpeakableTextProps {
  text: string;
  children?: ReactNode;
  className?: string;
  rowClassName?: string;
  align?: "left" | "center" | "right";
  block?: boolean;
  size?: "sm" | "md";
  variant?: "surface" | "primary" | "onDark";
}

export function SpeakableText({
  text,
  children,
  className,
  rowClassName,
  align = "left",
  block = false,
  size = "md",
  variant = "surface",
}: SpeakableTextProps) {
  const rowClasses = [
    styles.row,
    styles[align],
    block ? styles.block : "",
    rowClassName ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rowClasses}>
      <span className={className ? `${styles.text} ${className}` : styles.text}>
        {children ?? text}
      </span>
      <SpeakButton text={text} size={size} variant={variant} stopPropagation />
    </div>
  );
}
