import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Camera, CheckCircle2, Clock, ImagePlus } from "lucide-react";
import { api, type ApiChallenge, type ApiUserChallenge } from "@/lib/api";
import { TakePictureModal } from "@/features/rewards/TakePictureModal";
import { SpeakableText } from "@/components/ui/SpeakableText";
import { useToast } from "@/components/ui/Toast";
import styles from "./RewardsPage.module.css";

const fallbackChallengeImage =
  "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=900&h=600&fit=crop";

export function RewardsPage() {
  const { showSuccess } = useToast();
  const [challenge, setChallenge] = useState<ApiChallenge | null>(null);
  const [myChallenges, setMyChallenges] = useState<ApiUserChallenge[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const joined = useMemo(
    () => myChallenges.find((item) => item.challengeId === challenge?.id),
    [myChallenges, challenge],
  );

  const load = async () => {
    setLoading(true);
    const [current, mine] = await Promise.all([api.currentChallenge(), api.myChallenges()]);
    setChallenge(current);
    setMyChallenges(mine);
    setLoading(false);
  };

  useEffect(() => {
    load().catch((err) => {
      setError(err instanceof Error ? err.message : "Failed to load challenge");
      setLoading(false);
    });
  }, []);

  const join = async () => {
    if (!challenge) return;
    await api.joinChallenge(challenge.id);
    await load();
    showSuccess("Challenge joined successfully");
  };

  const hasBefore = joined?.pictures.some((picture) => picture.kind === "BEFORE") ?? false;
  const hasAfter = joined?.pictures.some((picture) => picture.kind === "AFTER") ?? false;
  const nextPictureKind = !hasBefore ? "BEFORE" : !hasAfter ? "AFTER" : "PROGRESS";
  const underReview = Boolean(joined) && hasBefore && hasAfter;
  const daysLeft = challenge
    ? Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <div className={`page-stack page-stack--rewards ${styles.page}`}>
      {error && <p className={styles.message}>{error}</p>}
      {loading ? (
        <p className={styles.message}>Loading challenge...</p>
      ) : !challenge ? (
        <p className={styles.message}>No active challenge.</p>
      ) : (
        <>
          <section className={styles.challengeCard}>
            <img className={styles.poster} src={challenge.thumbnailUrl || fallbackChallengeImage} alt="" />
            <div className={styles.challengeBody}>
              <div>
                <p className={styles.eyebrow}>This month's challenge</p>
                <SpeakableText text={challenge.title} block>
                  <h1 className={styles.title}>{challenge.title}</h1>
                </SpeakableText>
                <p className={styles.detail}>{challenge.detail}</p>
              </div>
              <div className={styles.daysBox}>
                <strong>{daysLeft}</strong>
                <span>Days</span>
                <small>Ends {new Date(challenge.endDate).toLocaleDateString()}</small>
              </div>
            </div>
            <button type="button" className={styles.ideaBtn}>
              See Challenge Ideas
            </button>
          </section>

          {!joined ? (
            <button type="button" className={styles.takePicture} onClick={() => void join()}>
              Try it
            </button>
          ) : (
            <section className={styles.progressCard}>
              <h2>My Challenge Progress</h2>
              <div className={styles.progressTop}>
                <strong>{joined.progressPct}%</strong>
                <span>{joined.progressStatus}</span>
              </div>
              <div className={styles.progressSteps}>
                <ProgressStep done={hasBefore} active={!hasBefore} icon={<Camera size={18} />} label="Take before picture" />
                <ProgressStep done={hasAfter} active={hasBefore && !hasAfter} icon={<ImagePlus size={18} />} label="Take after picture" />
                <ProgressStep
                  done={joined.reviewStatus === "APPROVED"}
                  active={underReview && joined.reviewStatus !== "APPROVED"}
                  icon={underReview ? <Clock size={18} /> : <CheckCircle2 size={18} />}
                  label="Review"
                />
              </div>
              <button type="button" className={styles.takePicture} onClick={() => setShowCamera(true)}>
                <span className={styles.takeIcon} aria-hidden>
                  <Camera size={22} />
                </span>
                <span className={styles.takeText}>
                  <strong>Take Picture</strong>
                  <span>Upload before or after progress</span>
                </span>
              </button>
            </section>
          )}
        </>
      )}

      {showCamera && joined && (
        <TakePictureModal
          userChallenge={joined}
          defaultKind={nextPictureKind}
          onUploaded={load}
          onSuccess={() => showSuccess("Picture uploaded successfully")}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}

function ProgressStep({ done, active, icon, label }: { done: boolean; active: boolean; icon: ReactNode; label: string }) {
  return (
    <div className={active ? styles.stepActive : done ? styles.stepDone : styles.step}>
      <span>{done ? <CheckCircle2 size={18} /> : icon}</span>
      <small>{label}</small>
    </div>
  );
}
