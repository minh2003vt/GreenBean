import { useMemo, useRef, useState } from "react";
import { Camera, Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { SpeakableText } from "@/components/ui/SpeakableText";
import { SpeakButton } from "@/components/ui/SpeakButton";
import styles from "./SellProductModal.module.css";

export const MARKET_CATEGORIES = [
  "Seeds",
  "Fertilizer",
  "Tools",
  "Irrigation",
  "Pest control",
  "Other",
] as const;

type MarketCategory = (typeof MARKET_CATEGORIES)[number];

export interface SellProductDraft {
  name: string;
  quantity: number;
  suggestedPrice: number;
  unit: string;
  category: MarketCategory;
  description: string;
  /** Raw photos selected by user; page uploads them before product submit. */
  photos: File[];
}

interface SellProductModalProps {
  onClose: () => void;
  onSubmit: (draft: SellProductDraft) => void | Promise<void>;
  initialDraft?: Partial<Omit<SellProductDraft, "photos">>;
  submitLabel?: string;
  title?: string;
}

export function SellProductModal({ onClose, onSubmit, initialDraft, submitLabel = "Submit", title = "Sell your product" }: SellProductModalProps) {
  const [name, setName] = useState(initialDraft?.name ?? "");
  const [quantity, setQuantity] = useState(initialDraft?.quantity != null ? String(initialDraft.quantity) : "");
  const [suggestedPrice, setSuggestedPrice] = useState(initialDraft?.suggestedPrice != null ? String(initialDraft.suggestedPrice) : "");
  const [unit, setUnit] = useState(initialDraft?.unit ?? "kg");
  const [category, setCategory] = useState<MarketCategory>((initialDraft?.category as MarketCategory | undefined) ?? "Seeds");
  const [description, setDescription] = useState(initialDraft?.description ?? "");
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(() => {
    return photos.map((f) => URL.createObjectURL(f));
  }, [photos]);

  const canSubmit =
    name.trim().length > 0 &&
    Number(quantity) > 0 &&
    Number(suggestedPrice) >= 0 &&
    unit.trim().length > 0 &&
    description.trim().length > 0 &&
    (initialDraft ? true : photos.length >= 1);

  const handlePickPhotos = () => inputRef.current?.click();

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const next = [...photos, ...files].slice(0, 3);
    if (photos.length + files.length > 3) {
      setError("You can upload up to 3 photos.");
    }
    setPhotos(next);

    // allow picking same file again later
    e.target.value = "";
  };

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError(initialDraft ? "Please fill in all fields." : "Please fill in all fields and add 1-3 photos.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        quantity: Number(quantity),
        suggestedPrice: Number(suggestedPrice),
        unit: unit.trim(),
        category,
        description: description.trim(),
        photos,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit product.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={title} onClose={handleClose} wide>
      <form className={styles.form} onSubmit={handleSubmit}>
        {error && (
          <SpeakableText text={error} block size="sm">
            <p className={styles.error}>{error}</p>
          </SpeakableText>
        )}

        <label className={styles.label}>
          <SpeakableText text="Product name" size="sm">
            Product name
          </SpeakableText>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Organic mulch bale"
          />
        </label>

        <div className={styles.row}>
          <label className={styles.label}>
            <SpeakableText text="Quantity" size="sm">
              Quantity
            </SpeakableText>
            <input
              className={styles.input}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 10"
              inputMode="numeric"
            />
          </label>

          <label className={styles.label}>
            <SpeakableText text="Your price" size="sm">
              Your price
            </SpeakableText>
            <input
              className={styles.input}
              value={suggestedPrice}
              onChange={(e) => setSuggestedPrice(e.target.value)}
              placeholder="e.g. 2.5"
              inputMode="decimal"
            />
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.label}>
            <SpeakableText text="Category" size="sm">
              Category
            </SpeakableText>
            <select
              className={styles.select}
              value={category}
              onChange={(e) => setCategory(e.target.value as MarketCategory)}
            >
              {MARKET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className={styles.label}>
          <SpeakableText text="Unit" size="sm">
            Unit
          </SpeakableText>
          <select className={styles.select} value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="kg">kg</option>
            <option value="bag">bag</option>
            <option value="bundle">bundle</option>
            <option value="piece">piece</option>
            <option value="box">box</option>
            <option value="liter">liter</option>
          </select>
        </label>

        <label className={styles.label}>
          <SpeakableText text="Product description" size="sm">
            Product description
          </SpeakableText>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your product quality, usage, and condition..."
            rows={3}
          />
        </label>

        <div className={styles.photos}>
          <SpeakableText text="Pictures (1 to 3)" size="sm">
            <span>Pictures (1-3)</span>
          </SpeakableText>
          <p className={styles.help}>
            {initialDraft ? "Add new photos only if you want to replace the current photo. You can upload up to 3." : "Add at least 1 photo. You can upload up to 3."}
          </p>

          <div className={styles.photoGrid}>
            {[0, 1, 2].map((i) => {
              const url = previews[i];
              return url ? (
                <img key={i} src={url} alt="" className={styles.photo} />
              ) : (
                <div key={i} className={styles.photoEmpty}>
                  <Camera size={18} />
                </div>
              );
            })}
          </div>

          <input
            ref={inputRef}
            className={styles.fileInput}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
          />

          <div className={styles.actions}>
            <button type="button" className={styles.secondaryBtn} onClick={handlePickPhotos}>
              Add photos
              <SpeakButton text="Add photos" size="sm" stopPropagation asChild />
            </button>
            <button type="submit" className={styles.primaryBtn} disabled={!canSubmit || submitting}>
              {submitting ? "Submitting..." : submitLabel}
              <Check size={16} />
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

