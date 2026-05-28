import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { SpeakButton } from "@/components/ui/SpeakButton";
import { api, type ApiUserChallenge } from "@/lib/api";
import { fileToDataUrl } from "@/lib/file";
import styles from "./TakePictureModal.module.css";

type PictureKind = "BEFORE" | "AFTER" | "PROGRESS";

interface TakePictureModalProps {
  userChallenge: ApiUserChallenge;
  defaultKind: PictureKind;
  onUploaded: () => Promise<void>;
  onSuccess?: () => void;
  onClose: () => void;
}

const labels: Record<PictureKind, string> = {
  BEFORE: "Before picture",
  AFTER: "After picture",
  PROGRESS: "Progress picture",
};

export function TakePictureModal({ userChallenge, defaultKind, onUploaded, onSuccess, onClose }: TakePictureModalProps) {
  const [kind, setKind] = useState<PictureKind>(defaultKind);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const url = URL.createObjectURL(selected);
    setFile(selected);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const handleClose = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    onClose();
  };

  const save = async () => {
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      if (!file.type.startsWith("image/")) {
        throw new Error("Please choose an image file.");
      }
      const uploaded = await api.uploadChallengePicture(await fileToDataUrl(file), "greenbean/challenges");
      const existingKinds = new Set(userChallenge.pictures.map((picture) => picture.kind));
      existingKinds.add(kind);
      const hasBefore = existingKinds.has("BEFORE");
      const hasAfter = existingKinds.has("AFTER");
      await api.updateUserChallenge(userChallenge.id, {
        progressStatus: hasBefore && hasAfter ? "IN_PROGRESS" : "IN_PROGRESS",
        progressPct: hasBefore && hasAfter ? 66 : hasBefore || hasAfter ? 33 : 0,
        pictures: [{ url: uploaded.url, caption: caption.trim() || labels[kind], kind, takenAt: new Date().toISOString() }],
      });
      await onUploaded();
      onSuccess?.();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload picture");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Take Picture" onClose={handleClose}>
      <div className={styles.upload}>
        <label className={styles.label}>
          Picture type
          <select className={styles.input} value={kind} onChange={(e) => setKind(e.target.value as PictureKind)}>
            <option value="BEFORE">Take before picture</option>
            <option value="AFTER">Take after picture</option>
            <option value="PROGRESS">Progress picture</option>
          </select>
        </label>

        <label className={styles.label}>
          Description
          <textarea
            className={styles.textarea}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Describe what changed in this picture"
            rows={3}
          />
        </label>

        {previewUrl ? (
          <img src={previewUrl} alt="Upload preview" className={styles.preview} />
        ) : (
          <button type="button" className={styles.placeholder} onClick={() => fileRef.current?.click()}>
            <Camera size={32} />
            <span>Open camera / gallery</span>
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className={styles.hiddenInput}
          onChange={handleFile}
        />

        <button type="button" className={styles.primaryBtn} onClick={() => fileRef.current?.click()}>
          {previewUrl ? "Choose another photo" : "Choose photo"}
          <SpeakButton text={previewUrl ? "Choose another photo" : "Choose photo"} size="sm" variant="onDark" stopPropagation asChild />
        </button>

        {error && <p className={styles.error}>{error}</p>}

        <button type="button" className={styles.secondaryBtn} onClick={() => void save()} disabled={!file || saving}>
          {saving ? "Checking image..." : "Submit photo"}
          <SpeakButton text="Submit photo" size="sm" stopPropagation asChild />
        </button>
      </div>
    </Modal>
  );
}
