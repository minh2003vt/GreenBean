import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { api, type ApiVideo } from "@/lib/api";
import { SpeakableText } from "@/components/ui/SpeakableText";
import { Modal } from "@/components/ui/Modal";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import styles from "./VideoPage.module.css";

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function VideoPage() {
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState<ApiVideo[]>([]);
  const [selected, setSelected] = useState<ApiVideo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.videos()
      .then(setVideos)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load videos"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return videos;
    return videos.filter((video) =>
      normalize(`${video.title} ${video.stepTitle} ${video.problemTitle}`).includes(q),
    );
  }, [query, videos]);

  return (
    <div className={`page-stack ${styles.page}`}>
      <div className={styles.top}>
        <div className={styles.searchWrap}>
          <Search size={18} />
          <input
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search problem videos..."
            aria-label="Search videos"
          />
        </div>
      </div>

      {error && <p className={styles.empty}>{error}</p>}
      {loading ? (
        <p className={styles.empty}>Loading videos...</p>
      ) : filtered.length === 0 ? (
        <SpeakableText text="No problem videos found." align="center" block>
          <p className={styles.empty}>No problem videos found.</p>
        </SpeakableText>
      ) : (
        <ul className={styles.list}>
          {filtered.map((video) => (
            <li key={video.id}>
              <button type="button" className={styles.card} onClick={() => setSelected(video)}>
                <div className={styles.thumbWrap}>
                  {video.thumbnailUrl ? <img className={styles.thumb} src={video.thumbnailUrl} alt="" loading="lazy" /> : null}
                </div>
                <div className={styles.meta}>
                  <SpeakableText text={video.title} block size="sm">
                    <p className={styles.videoTitle}>{video.title}</p>
                  </SpeakableText>
                  <SpeakableText text={video.problemTitle} block size="sm">
                    <p className={styles.channel}>{video.problemTitle} · {video.stepTitle}</p>
                  </SpeakableText>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)} wide>
          <div className={styles.playerWrap}>
            {getYouTubeEmbedUrl(selected.url) ? (
              <iframe
                className={styles.embed}
                src={getYouTubeEmbedUrl(selected.url) ?? undefined}
                title={selected.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <video className={styles.player} src={selected.url} controls playsInline />
            )}
            <button type="button" className={styles.closeInline} onClick={() => setSelected(null)}>
              <X size={16} /> Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
