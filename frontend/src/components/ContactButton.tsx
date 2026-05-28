import { MessageCircle } from "lucide-react";
import { SpeakButton } from "@/components/ui/SpeakButton";
import styles from "./ContactButton.module.css";

interface ContactButtonProps {
  className?: string;
}

export function ContactButton({ className }: ContactButtonProps) {
  return (
    <button
      type="button"
      className={className ? `${styles.btn} ${className}` : styles.btn}
    >
      <MessageCircle size={16} />
      <span>Contact Us</span>
      <SpeakButton text="Contact Us" size="sm" stopPropagation asChild />
    </button>
  );
}
