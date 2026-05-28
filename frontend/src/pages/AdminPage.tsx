import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/app/AuthContext";
import { Modal } from "@/components/ui/Modal";
import { api, type ApiChallenge, type ApiProblem, type ApiProduct, type ApiStepMedia, type ApiUser } from "@/lib/api";
import { fileToDataUrl } from "@/lib/file";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import styles from "./AdminPage.module.css";

type ModuleId = "overview" | "problems" | "market" | "challenges" | "users";
type MarketStatusFilter = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

type Participant = {
  id: string;
  progressPct: number;
  progressStatus: string;
  reviewStatus: string;
  isWinner: boolean;
  rewardPaidAt?: string | null;
  user: { name: string; email: string; phone?: string | null };
  pictures: Array<{ id: string; url: string; kind: string; aiReview?: string | null; aiIsRelevant?: boolean | null; aiIsFresh?: boolean | null }>;
};

const modules: Array<{ id: ModuleId; label: string; desc: string }> = [
  { id: "overview", label: "Overview", desc: "Operational map and quick counts" },
  { id: "problems", label: "Problems", desc: "Content, steps, media" },
  { id: "market", label: "Market", desc: "Submissions and listing approval" },
  { id: "challenges", label: "Challenges", desc: "Monthly challenge, participants, rewards" },
  { id: "users", label: "Users", desc: "Accounts and blocking" },
];

function normalizeSearch(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function includesSearch(values: unknown[], query: string) {
  const q = normalizeSearch(query);
  if (!q) return true;
  return values.some((value) => normalizeSearch(value).includes(q));
}

export function AdminPage() {
  const { user, logout } = useAuth();
  const [active, setActive] = useState<ModuleId>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [problems, setProblems] = useState<ApiProblem[]>([]);
  const [submissions, setSubmissions] = useState<ApiProduct[]>([]);
  const [marketFilter, setMarketFilter] = useState<MarketStatusFilter>("ALL");
  const [challenges, setChallenges] = useState<ApiChallenge[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [participants, setParticipants] = useState<Record<string, Participant[]>>({});

  if (user?.role !== "ADMIN") return <Navigate to="/" replace />;

  const load = async (module: ModuleId) => {
    setActive(module);
    setError(null);
    if (module === "overview") return;
    setLoading(true);
    try {
      if (module === "problems") setProblems(await api.adminProblems());
      if (module === "market") setSubmissions((await api.submissions(marketFilter === "ALL" ? undefined : marketFilter)).items);
      if (module === "challenges") setChallenges((await api.challenges()).items);
      if (module === "users") setUsers(await api.users());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async (challengeId: string) => {
    const items = await api.participants(challengeId);
    setParticipants((prev) => ({ ...prev, [challengeId]: items as Participant[] }));
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>GreenBean operations</p>
          <h1 className={styles.title}>Admin console</h1>
        </div>
        <button className={styles.logout} type="button" onClick={() => void logout()}>Logout</button>
      </header>

      <section className={styles.map}>
        {modules.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.moduleCard} ${active === item.id ? styles.moduleCardActive : ""}`}
            onClick={() => void load(item.id)}
          >
            <strong>{item.label}</strong>
            <span>{item.desc}</span>
          </button>
        ))}
      </section>

      {error && <p className={styles.error}>{error}</p>}
      {loading && <p className={styles.meta}>Loading...</p>}

      <section className={styles.workspace}>
        {active === "overview" && <Overview />}
        {active === "problems" && <ProblemsPanel problems={problems} refresh={() => load("problems")} />}
        {active === "market" && (
          <MarketPanelV2
            submissions={submissions}
            filter={marketFilter}
            setFilter={(filter) => {
              setMarketFilter(filter);
              setLoading(true);
              api.submissions(filter === "ALL" ? undefined : filter)
                .then((page) => setSubmissions(page.items))
                .catch((err) => setError(err instanceof Error ? err.message : "Failed to load products"))
                .finally(() => setLoading(false));
            }}
            refresh={() => load("market")}
          />
        )}
        {active === "challenges" && (
          <ChallengesPanelV2
            challenges={challenges}
            participants={participants}
            loadParticipants={loadParticipants}
            refresh={() => load("challenges")}
          />
        )}
        {active === "users" && <UsersPanelV2 users={users} refresh={() => load("users")} />}
      </section>
    </main>
  );
}

function Overview() {
  return (
    <div className={styles.diagram}>
      <div>Problems</div>
      <span>create content</span>
      <div>Market</div>
      <span>approve listings</span>
      <div>Challenges</div>
      <span>review progress</span>
      <div>Users</div>
      <span>moderate access</span>
    </div>
  );
}

function ProblemsPanel({ problems, refresh }: { problems: ApiProblem[]; refresh: () => void | Promise<void> }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [stepProblemId, setStepProblemId] = useState("");
  const [stepId, setStepId] = useState("");
  const [stepTitle, setStepTitle] = useState("");
  const [stepDescription, setStepDescription] = useState("");
  const [stepThumbnailUrl, setStepThumbnailUrl] = useState("");
  const [mediaProblemId, setMediaProblemId] = useState("");
  const [mediaStepId, setMediaStepId] = useState("");
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO" | "AUDIO">("IMAGE");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaDescription, setMediaDescription] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [editingMedia, setEditingMedia] = useState<{
    problemId: string;
    stepId: string;
    mediaId: string;
    mediaType: "IMAGE" | "VIDEO" | "AUDIO";
    url: string;
    title: string;
    description: string;
  } | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, ApiProblem>>({});
  const [preview, setPreview] = useState<{
    title: string;
    description?: string | null;
    url: string;
    mediaType: "IMAGE" | "VIDEO" | "AUDIO";
  } | null>(null);
  const [imagePreview, setImagePreview] = useState<{
    stepTitle: string;
    stepNumber: number;
    images: ApiStepMedia[];
    index: number;
  } | null>(null);
  const [search, setSearch] = useState("");

  const resetDetails = () => {
    setDetails({});
    setExpandedId(null);
  };

  const toggleProblem = async (problem: ApiProblem) => {
    if (expandedId === problem.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(problem.id);
    await loadProblemDetail(problem);
  };

  const loadProblemDetail = async (problem: ApiProblem) => {
    if (!details[problem.id]) {
      const detail = await api.problem(problem.slug);
      setDetails((prev) => ({ ...prev, [problem.id]: detail }));
    }
  };

  const create = async () => {
    setWorking(true);
    await api.createProblem({ title, description, thumbnailUrl: thumbnailUrl || undefined });
    setTitle("");
    setDescription("");
    setThumbnailUrl("");
    setNotice("Problem created successfully");
    setWorking(false);
    resetDetails();
    await refresh();
  };

  const addStep = async () => {
    setWorking(true);
    const problem = problems.find((item) => item.id === stepProblemId);
    await api.addStep(stepProblemId, {
      stepNumber: (problem?.steps.length ?? 0) + 1,
      title: stepTitle,
      description: stepDescription,
      thumbnailUrl: stepThumbnailUrl || undefined,
    });
    setStepTitle("");
    setStepDescription("");
    setStepThumbnailUrl("");
    setNotice("Step added successfully");
    setWorking(false);
    resetDetails();
    await refresh();
  };

  const updateStep = async () => {
    setWorking(true);
    await api.updateStep(stepProblemId, stepId, {
      title: stepTitle,
      description: stepDescription,
      thumbnailUrl: stepThumbnailUrl || undefined,
    });
    setNotice("Step updated successfully");
    setWorking(false);
    resetDetails();
    await refresh();
  };

  const addMedia = async () => {
    setWorking(true);
    try {
      const uploadedUrls = mediaFiles.length > 0
        ? await Promise.all(mediaFiles.map(async (file) => (await api.uploadFile(await fileToDataUrl(file), "greenbean/problem-media")).url))
        : [];
      const urls = uploadedUrls.length > 0 ? uploadedUrls : mediaUrl.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
      await Promise.all(urls.map((url, index) => api.addStepMedia(mediaProblemId, mediaStepId, {
        mediaType,
        url,
        title: mediaTitle || undefined,
        description: mediaDescription || undefined,
        sortOrder: index,
      })));
      setMediaUrl("");
      setMediaTitle("");
      setMediaDescription("");
      setMediaFiles([]);
      setNotice("Media added successfully");
      resetDetails();
      await refresh();
    } catch (err) {
      setNotice(null);
      alert(err instanceof Error ? err.message : "Failed to add media");
    } finally {
      setWorking(false);
    }
  };

  const updateMedia = async () => {
    if (!editingMedia) return;
    setWorking(true);
    const url = editFile ? (await api.uploadFile(await fileToDataUrl(editFile), "greenbean/problem-media")).url : editingMedia.url;
    await api.updateStepMedia(editingMedia.problemId, editingMedia.stepId, editingMedia.mediaId, {
      mediaType: editingMedia.mediaType,
      url,
      title: editingMedia.title || undefined,
      description: editingMedia.description || undefined,
    });
    setEditingMedia(null);
    setEditFile(null);
    setNotice("Media updated successfully");
    setWorking(false);
    resetDetails();
    await refresh();
  };

  const deleteStep = async (problemId: string, stepId: string, label: string) => {
    if (!window.confirm(`Delete step "${label}"?`)) return;
    await api.deleteStep(problemId, stepId);
    resetDetails();
    await refresh();
  };

  const deleteMedia = async (problemId: string, stepId: string, mediaId: string, label: string) => {
    if (!window.confirm(`Delete media "${label}"?`)) return;
    await api.deleteStepMedia(problemId, stepId, mediaId);
    resetDetails();
    await refresh();
  };

  const startEditMedia = (problemId: string, stepId: string, media: ApiStepMedia) => {
    setEditingMedia({
      problemId,
      stepId,
      mediaId: media.id,
      mediaType: media.mediaType,
      url: media.url,
      title: media.title ?? "",
      description: media.description ?? "",
    });
    setEditFile(null);
  };

  const selectedMediaProblem = problems.find((problem) => problem.id === mediaProblemId);
  const selectedMediaStep = selectedMediaProblem?.steps.find((step) => step.id === mediaStepId);
  const selectedDetail = mediaProblemId ? details[mediaProblemId] : undefined;
  const selectedDetailStep = selectedDetail?.steps.find((step) => step.id === mediaStepId);
  const selectedStepImageCount = selectedDetailStep?.media?.filter((media) => media.mediaType === "IMAGE").length ?? 0;
  const selectedStepHasVideo = selectedDetailStep?.media?.some((media) => media.mediaType === "VIDEO") ?? false;
  const selectedStepHasAudio = selectedDetailStep?.media?.some((media) => media.mediaType === "AUDIO") ?? false;
  const pendingMediaCount = mediaFiles.length > 0 ? mediaFiles.length : mediaUrl.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean).length;
  const imageStepReady = mediaType !== "IMAGE" || Boolean(selectedDetailStep);
  const canAddImage = mediaType !== "IMAGE" || (imageStepReady && selectedStepImageCount + pendingMediaCount <= 5);
  const singleMediaBlocked = (mediaType === "VIDEO" && selectedStepHasVideo) || (mediaType === "AUDIO" && selectedStepHasAudio);
  const tooManySingleMedia = mediaType !== "IMAGE" && pendingMediaCount > 1;
  const filteredProblems = problems.filter((problem) => {
    const detail = details[problem.id];
    return includesSearch([
      problem.title,
      problem.slug,
      problem.description,
      ...problem.steps.flatMap((step) => [step.title, step.description]),
      ...(detail?.steps.flatMap((step) => [
        step.title,
        step.description,
        ...(step.media ?? []).flatMap((media) => [media.mediaType, media.title, media.description, media.url]),
      ]) ?? []),
    ], search);
  });

  return (
    <div className={styles.panel}>
      <h2>Problems</h2>
      <input className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search problems, steps, media..." />
      {notice && <p className={styles.success}>{notice}</p>}
      <div className={styles.formRow}>
        <input placeholder="Problem title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Thumbnail URL" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} />
        <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button type="button" onClick={() => void create()} disabled={!title || !description || working}>{working ? "Saving..." : "Create"}</button>
      </div>
      <div className={styles.formRow}>
        <select value={stepProblemId} onChange={(e) => { setStepProblemId(e.target.value); setStepId(""); }}>
          <option value="">Select problem for step</option>
          {problems.map((problem) => <option key={problem.id} value={problem.id}>{problem.title}</option>)}
        </select>
        <select value={stepId} onChange={(e) => {
          const selectedId = e.target.value;
          setStepId(selectedId);
          const selected = problems.find((problem) => problem.id === stepProblemId)?.steps.find((step) => step.id === selectedId);
          if (selected) {
            setStepTitle(selected.title);
            setStepDescription(selected.description);
            setStepThumbnailUrl(selected.thumbnailUrl ?? "");
          }
        }}>
          <option value="">New step</option>
          {problems.find((problem) => problem.id === stepProblemId)?.steps.map((step) => <option key={step.id} value={step.id}>{step.stepNumber}. {step.title}</option>)}
        </select>
        <input placeholder="Step title" value={stepTitle} onChange={(e) => setStepTitle(e.target.value)} />
        <input placeholder="Step description" value={stepDescription} onChange={(e) => setStepDescription(e.target.value)} />
        <input placeholder="Step thumbnail URL" value={stepThumbnailUrl} onChange={(e) => setStepThumbnailUrl(e.target.value)} />
        <button type="button" onClick={() => stepId ? void updateStep() : void addStep()} disabled={!stepProblemId || !stepTitle || !stepDescription || working}>
          {stepId ? "Update step" : "Add step"}
        </button>
      </div>
      <div className={styles.formRow}>
        <select value={mediaProblemId} onChange={(e) => {
          const nextProblemId = e.target.value;
          setMediaProblemId(nextProblemId);
          setMediaStepId("");
          const problem = problems.find((item) => item.id === nextProblemId);
          if (problem) void loadProblemDetail(problem);
        }}>
          <option value="">Select problem for media</option>
          {problems.map((problem) => <option key={problem.id} value={problem.id}>{problem.title}</option>)}
        </select>
        <select value={mediaStepId} onChange={(e) => {
          const nextStepId = e.target.value;
          setMediaStepId(nextStepId);
          const problem = problems.find((item) => item.id === mediaProblemId);
          if (problem && nextStepId) void loadProblemDetail(problem);
        }}>
          <option value="">Select step</option>
          {problems.find((problem) => problem.id === mediaProblemId)?.steps.map((step) => <option key={step.id} value={step.id}>{step.stepNumber}. {step.title}</option>)}
        </select>
        <select value={mediaType} onChange={(e) => setMediaType(e.target.value as "IMAGE" | "VIDEO" | "AUDIO")}>
          <option value="IMAGE">IMAGE / slide</option>
          <option value="VIDEO">VIDEO</option>
          <option value="AUDIO">AUDIO</option>
        </select>
        <input placeholder="Media title" value={mediaTitle} onChange={(e) => setMediaTitle(e.target.value)} />
        <textarea className={styles.textarea} placeholder="Media description. Example: before mulching, after watering, or what this picture shows." value={mediaDescription} onChange={(e) => setMediaDescription(e.target.value)} />
        <textarea className={styles.textarea} placeholder="Media URL. For multiple step-pictures, paste one URL per line or comma-separated. YouTube links are saved as embed URLs." value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} disabled={mediaFiles.length > 0} />
        <label className={styles.fileInput}>
          Upload from device
          <input
            type="file"
            multiple={mediaType === "IMAGE"}
            accept={mediaType === "IMAGE" ? "image/*" : mediaType === "AUDIO" ? "audio/*" : "video/*"}
            onChange={(e) => setMediaFiles(Array.from(e.target.files ?? []))}
          />
        </label>
        {mediaFiles.length > 0 && <p className={styles.mediaHint}>Selected files: {mediaFiles.map((file) => file.name).join(", ")}</p>}
        {selectedMediaStep && (
          <p className={styles.mediaHint}>
            Adding to Step {selectedMediaStep.stepNumber}: {selectedMediaStep.title}
            {mediaType === "IMAGE" ? ` - ${selectedDetailStep ? `${selectedStepImageCount}/5 pictures already saved` : " loading picture count..."}` : ""}
          </p>
        )}
        {!canAddImage && <p className={styles.error}>This step can have max 5 pictures. Remove one first or choose another step.</p>}
        {singleMediaBlocked && <p className={styles.error}>This step already has one {mediaType.toLowerCase()}. Delete or edit the existing one first.</p>}
        {tooManySingleMedia && <p className={styles.error}>Add only one {mediaType.toLowerCase()} for this step.</p>}
        <button type="button" onClick={() => void addMedia()} disabled={!mediaProblemId || !mediaStepId || (!mediaUrl && mediaFiles.length === 0) || !imageStepReady || !canAddImage || singleMediaBlocked || tooManySingleMedia || working}>Add media</button>
      </div>
      <div className={styles.table}>
        {filteredProblems.map((problem) => (
          <article key={problem.id} className={styles.rowCard}>
            <div><strong>{problem.title}</strong><p>{problem.slug} · {problem.steps.length} steps</p></div>
            <button type="button" onClick={() => void toggleProblem(problem)}>{expandedId === problem.id ? "Hide contents" : "View contents"}</button>
            <button type="button" onClick={() => window.confirm(`Delete ${problem.title}?`) && void api.deleteProblem(problem.id).then(() => { resetDetails(); return refresh(); })}>Delete</button>
            {expandedId === problem.id && (
              <div className={styles.problemDetail}>
                {details[problem.id] ? (
                  details[problem.id].steps.length > 0 ? (
                    details[problem.id].steps.map((step) => (
                      <section key={step.id} className={styles.stepDetail}>
                        <div className={styles.stepHeader}>
                          <div>
                            <strong>Step {step.stepNumber}: {step.title}</strong>
                            <p>{step.description}</p>
                          </div>
                          <button type="button" onClick={() => void deleteStep(problem.id, step.id, step.title)}>Delete step</button>
                        </div>
                        {step.thumbnailUrl && <img className={styles.detailThumb} src={step.thumbnailUrl} alt="" loading="lazy" />}
                        {(step.media ?? []).some((media) => media.mediaType === "IMAGE") && (
                          <div className={styles.stepPictures}>
                            <strong>Step {step.stepNumber} pictures</strong>
                            <div className={styles.pictureGrid}>
                              {(step.media ?? []).filter((media) => media.mediaType === "IMAGE").map((media, imageIndex, images) => (
                                <button
                                  key={media.id}
                                  type="button"
                                  className={styles.pictureCard}
                                  onClick={() => setImagePreview({ stepTitle: step.title, stepNumber: step.stepNumber, images, index: imageIndex })}
                                >
                                  <img src={media.url} alt={media.title ?? ""} loading="lazy" />
                                  <span>{media.title || `Picture ${imageIndex + 1}`}</span>
                                  {media.description && <small>{media.description}</small>}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className={styles.mediaList}>
                          {(step.media ?? []).length === 0 ? (
                            <p className={styles.meta}>No media on this step yet.</p>
                          ) : (
                            (step.media ?? []).map((media) => (
                              <div key={media.id} className={styles.mediaItem}>
                                <span className={styles.badge}>{media.mediaType}</span>
                                <div>
                                  <strong>{media.title || media.url}</strong>
                                  {media.description && <p>{media.description}</p>}
                                  <p>{media.url}</p>
                                </div>
                                <button type="button" onClick={() => {
                                  if (media.mediaType === "IMAGE") {
                                    const images = (step.media ?? []).filter((item) => item.mediaType === "IMAGE");
                                    setImagePreview({ stepTitle: step.title, stepNumber: step.stepNumber, images, index: Math.max(0, images.findIndex((item) => item.id === media.id)) });
                                    return;
                                  }
                                  setPreview({ title: media.title || step.title, description: media.description, url: media.url, mediaType: media.mediaType });
                                }}>Preview</button>
                                <button type="button" onClick={() => startEditMedia(problem.id, step.id, media)}>Edit</button>
                                <a className={styles.linkButton} href={media.url} target="_blank" rel="noreferrer">Open</a>
                                <button type="button" onClick={() => void deleteMedia(problem.id, step.id, media.id, media.title || media.url)}>Delete</button>
                                {editingMedia?.mediaId === media.id && (
                                  <div className={styles.editMediaForm}>
                                    <select value={editingMedia.mediaType} onChange={(e) => setEditingMedia({ ...editingMedia, mediaType: e.target.value as "IMAGE" | "VIDEO" | "AUDIO" })}>
                                      <option value="IMAGE">IMAGE / slide</option>
                                      <option value="VIDEO">VIDEO</option>
                                      <option value="AUDIO">AUDIO</option>
                                    </select>
                                    <input placeholder="Media title" value={editingMedia.title} onChange={(e) => setEditingMedia({ ...editingMedia, title: e.target.value })} />
                                    <textarea className={styles.textarea} placeholder="Media description" value={editingMedia.description} onChange={(e) => setEditingMedia({ ...editingMedia, description: e.target.value })} />
                                    <textarea className={styles.textarea} placeholder="Media URL" value={editingMedia.url} onChange={(e) => setEditingMedia({ ...editingMedia, url: e.target.value })} disabled={Boolean(editFile)} />
                                    <label className={styles.fileInput}>
                                      Replace from device
                                      <input type="file" accept={editingMedia.mediaType === "IMAGE" ? "image/*" : editingMedia.mediaType === "AUDIO" ? "audio/*" : "video/*"} onChange={(e) => setEditFile(e.target.files?.[0] ?? null)} />
                                    </label>
                                    {editFile && <p className={styles.mediaHint}>Selected file: {editFile.name}</p>}
                                    <button type="button" onClick={() => void updateMedia()} disabled={working}>Save media</button>
                                    <button type="button" onClick={() => { setEditingMedia(null); setEditFile(null); }}>Cancel</button>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </section>
                    ))
                  ) : (
                    <p className={styles.meta}>No steps yet.</p>
                  )
                ) : (
                  <p className={styles.meta}>Loading problem contents...</p>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
      {preview && <AdminMediaPreview preview={preview} onClose={() => setPreview(null)} />}
      {imagePreview && <AdminImagePreview preview={imagePreview} onClose={() => setImagePreview(null)} onChange={(index) => setImagePreview({ ...imagePreview, index })} />}
    </div>
  );
}

function AdminMediaPreview({
  preview,
  onClose,
}: {
  preview: { title: string; description?: string | null; url: string; mediaType: "IMAGE" | "VIDEO" | "AUDIO" };
  onClose: () => void;
}) {
  const embedUrl = getYouTubeEmbedUrl(preview.url);

  return (
    <Modal title={preview.title} onClose={onClose} wide>
      {preview.description && <p className={styles.previewDescription}>{preview.description}</p>}
      {preview.mediaType === "VIDEO" && embedUrl ? (
        <iframe
          className={styles.previewEmbed}
          src={embedUrl}
          title={preview.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : preview.mediaType === "AUDIO" ? (
        <>
          <audio className={styles.previewAudio} src={preview.url} controls />
          {preview.url.includes("youtube.com/embed/") && <p className={styles.mediaHint}>This is a YouTube link. For audio-only preview, upload an MP3/audio file or set this media as VIDEO.</p>}
        </>
      ) : (
        <video className={styles.previewVideo} src={preview.url} controls playsInline />
      )}
    </Modal>
  );
}

function AdminImagePreview({
  preview,
  onClose,
  onChange,
}: {
  preview: { stepTitle: string; stepNumber: number; images: ApiStepMedia[]; index: number };
  onClose: () => void;
  onChange: (index: number) => void;
}) {
  const current = preview.images[preview.index];
  const total = preview.images.length;
  const prev = () => onChange(Math.max(0, preview.index - 1));
  const next = () => onChange(Math.min(total - 1, preview.index + 1));

  return (
    <Modal title={`${preview.stepNumber}. ${preview.stepTitle}`} onClose={onClose} wide>
      <div className={styles.imagePreview}>
        <img className={styles.previewImage} src={current.url} alt={current.title ?? ""} />
        <p className={styles.stepLabel}>Step picture {preview.index + 1} of {total}</p>
        {current.title && <strong>{current.title}</strong>}
        {current.description && <p className={styles.previewDescription}>{current.description}</p>}
        <div className={styles.galleryControls}>
          <button type="button" onClick={prev} disabled={preview.index === 0}>Previous</button>
          <span>{preview.index + 1} / {total}</span>
          <button type="button" onClick={next} disabled={preview.index === total - 1}>Next</button>
        </div>
      </div>
    </Modal>
  );
}

function LegacyMarketPanel({ submissions, refresh }: { submissions: ApiProduct[]; refresh: () => void }) {
  const approve = async (id: string) => {
    await api.approveProduct(id, { approvalStatus: "APPROVED" });
    await refresh();
  };

  const reject = async (id: string) => {
    await api.approveProduct(id, { approvalStatus: "REJECTED", adminNote: "Rejected by admin review" });
    await refresh();
  };

  return (
    <div className={styles.panel}>
      <h2>Market submissions</h2>
      <div className={styles.table}>
        {submissions.map((product) => (
          <article key={product.id} className={styles.rowCard}>
            <div><strong>{product.name}</strong><p>{product.category} · qty {product.quantity}</p><p>{product.description}</p></div>
            {product.thumbnailUrl && <img className={styles.thumb} src={product.thumbnailUrl} alt="" />}
            <div className={styles.actions}>
              <button type="button" onClick={() => void approve(product.id)}>Approve</button>
              <button type="button" onClick={() => void reject(product.id)}>Reject</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

void LegacyMarketPanel;

function MarketPanelV2({
  submissions,
  filter,
  setFilter,
  refresh,
}: {
  submissions: ApiProduct[];
  filter: MarketStatusFilter;
  setFilter: (filter: MarketStatusFilter) => void;
  refresh: () => void | Promise<void>;
}) {
  const [selected, setSelected] = useState<ApiProduct | null>(null);
  const [listingPrice, setListingPrice] = useState("1");
  const [listingProduct, setListingProduct] = useState<ApiProduct | null>(null);
  const [rejectReason, setRejectReason] = useState("Please update your price in the submission and send it again.");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const openDetail = (product: ApiProduct) => {
    setSelected(product);
    setListingPrice(String(product.listingPrice ?? product.suggestedPrice ?? 1));
    setRejectReason(product.adminNote ?? "Please update your price in the submission and send it again.");
  };

  const openListing = (product: ApiProduct) => {
    setListingProduct(product);
    setListingPrice(String(product.listingPrice ?? product.suggestedPrice ?? 1));
  };

  const approve = async (product: ApiProduct) => {
    setBusyId(product.id);
    await api.approveProduct(product.id, {
      approvalStatus: "APPROVED",
    });
    setNotice(`${product.name} approved for purchase. Set a market sale price to list it.`);
    setSelected(null);
    setBusyId(null);
    await refresh();
  };

  const list = async (product: ApiProduct) => {
    setBusyId(product.id);
    await api.listProduct(product.id, {
      listingPrice: Number(listingPrice || product.suggestedPrice || 1),
      isActive: true,
    });
    setNotice(`${product.name} listed on market.`);
    setSelected(null);
    setListingProduct(null);
    setBusyId(null);
    await refresh();
  };

  const reject = async (product: ApiProduct) => {
    setBusyId(product.id);
    await api.approveProduct(product.id, { approvalStatus: "REJECTED", adminNote: rejectReason || "Please update your price in the submission and send it again." });
    setNotice(`${product.name} rejected.`);
    setSelected(null);
    setBusyId(null);
    await refresh();
  };
  const filteredSubmissions = submissions.filter((product) => includesSearch([
    product.name,
    product.description,
    product.category,
    product.unit,
    product.quantity,
    product.suggestedPrice,
    product.listingPrice,
    product.approvalStatus,
    product.isActive ? "listed" : "not listed",
    product.submittedBy?.name,
    product.adminNote,
  ], search));

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h2>Market submissions</h2>
          <p className={styles.meta}>Approve purchase first, then set the sale price and list it on market.</p>
        </div>
        <div className={styles.filterBar}>
          {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((item) => (
            <button key={item} type="button" className={filter === item ? styles.filterActive : ""} onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <input className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products, sellers, status, price..." />
      {notice && <p className={styles.success}>{notice}</p>}
      <div className={styles.table}>
        {filteredSubmissions.length === 0 ? (
          <p className={styles.meta}>No submissions in this filter.</p>
        ) : (
          filteredSubmissions.map((product) => (
            <article key={product.id} className={styles.marketCard}>
              {product.thumbnailUrl && <img className={styles.marketThumb} src={product.thumbnailUrl} alt="" />}
              <div>
                <strong>{product.name}</strong>
                <p>{product.category} - qty {product.quantity} {product.unit}</p>
                <p>{product.description}</p>
                <div className={styles.statusLine}>
                  <span className={statusClass(product.approvalStatus)}>{product.approvalStatus ?? "PENDING"}</span>
                  <span>Accepted buy price: {product.suggestedPrice}</span>
                  {product.listingPrice != null && <span>Sale price: {product.listingPrice}</span>}
                  <span>{product.isActive ? "Listed" : "Not listed"}</span>
                </div>
              </div>
              <div className={styles.actions}>
                <button type="button" onClick={() => openDetail(product)}>Detail</button>
                {product.approvalStatus === "APPROVED" && !product.isActive && (
                  <button type="button" onClick={() => openListing(product)} disabled={busyId === product.id}>List to market</button>
                )}
              </div>
            </article>
          ))
        )}
      </div>
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)} wide>
          <div className={styles.marketDetail}>
            {(selected.imageUrls?.length ? selected.imageUrls : selected.thumbnailUrl ? [selected.thumbnailUrl] : []).length > 0 && (
              <div className={styles.productImageGrid}>
                {(selected.imageUrls?.length ? selected.imageUrls : selected.thumbnailUrl ? [selected.thumbnailUrl] : []).map((url, index) => (
                  <img key={`${url}-${index}`} className={styles.productDetailImage} src={url} alt="" />
                ))}
              </div>
            )}
            <div className={styles.detailGrid}>
              <div><strong>Status</strong><span>{selected.approvalStatus ?? "PENDING"}</span></div>
              <div><strong>Seller</strong><span>{selected.submittedBy?.name ?? "Unknown"}</span></div>
              <div><strong>Category</strong><span>{selected.category}</span></div>
              <div><strong>Quantity</strong><span>{selected.quantity} {selected.unit}</span></div>
              <div><strong>Accepted buy price</strong><span>{selected.suggestedPrice}</span></div>
              {selected.listingPrice != null && <div><strong>Sale price</strong><span>{selected.listingPrice}</span></div>}
              <div><strong>Listed</strong><span>{selected.isActive ? "Yes" : "No"}</span></div>
              {selected.adminNote && <div><strong>Admin note</strong><span>{selected.adminNote}</span></div>}
            </div>
            <p className={styles.previewDescription}>{selected.description}</p>
            <div className={styles.editMediaForm}>
              <textarea className={styles.textarea} placeholder="Reject note. Example: Please update the price to 4.50 and send it again." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
              {selected.approvalStatus === "APPROVED" && !selected.isActive && <input placeholder="Market sale price" value={listingPrice} onChange={(e) => setListingPrice(e.target.value)} />}
              {selected.approvalStatus === "PENDING" && <button type="button" onClick={() => void approve(selected)} disabled={busyId === selected.id}>Approve purchase</button>}
              {selected.approvalStatus === "PENDING" && <button type="button" onClick={() => void reject(selected)} disabled={busyId === selected.id}>Reject</button>}
              {selected.approvalStatus === "APPROVED" && !selected.isActive && <button type="button" onClick={() => void list(selected)} disabled={busyId === selected.id || !Number(listingPrice)}>List to market</button>}
              {selected.approvalStatus === "REJECTED" && <button type="button" onClick={() => void approve(selected)} disabled={busyId === selected.id}>Approve purchase</button>}
            </div>
          </div>
        </Modal>
      )}
      {listingProduct && (
        <Modal title={`List ${listingProduct.name}`} onClose={() => setListingProduct(null)} wide>
          <div className={styles.editMediaForm}>
            <input placeholder="Market sale price" value={listingPrice} onChange={(e) => setListingPrice(e.target.value)} />
            <button type="button" onClick={() => void list(listingProduct)} disabled={busyId === listingProduct.id || !Number(listingPrice)}>List to market</button>
            <button type="button" onClick={() => setListingProduct(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function statusClass(status?: ApiProduct["approvalStatus"]) {
  if (status === "APPROVED") return `${styles.statusBadge} ${styles.statusApproved}`;
  if (status === "REJECTED") return `${styles.statusBadge} ${styles.statusRejected}`;
  return `${styles.statusBadge} ${styles.statusPending}`;
}

function ChallengesPanel({
  challenges,
  participants,
  loadParticipants,
  refresh,
}: {
  challenges: ApiChallenge[];
  participants: Record<string, Participant[]>;
  loadParticipants: (id: string) => Promise<void>;
  refresh: () => void;
}) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE" | "ENDED">("DRAFT");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    return end.toISOString().slice(0, 10);
  });

  const create = async () => {
    await api.createChallenge({
      title,
      detail,
      status,
      startDate,
      endDate,
    });
    setTitle("");
    setDetail("");
    await refresh();
  };

  return (
    <div className={styles.panel}>
      <h2>Challenges</h2>
      <div className={styles.formRow}>
        <input placeholder="Challenge title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Detail" value={detail} onChange={(e) => setDetail(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value as "DRAFT" | "ACTIVE" | "ENDED")}>
          <option value="DRAFT">DRAFT</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="ENDED">ENDED</option>
        </select>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button type="button" onClick={() => void create()} disabled={!title || !detail}>Create</button>
      </div>
      {challenges.map((challenge) => (
        <article key={challenge.id} className={styles.rowCard}>
          <div><strong>{challenge.title}</strong><p>{challenge.status} · {challenge.startDate.slice(0, 10)} to {challenge.endDate.slice(0, 10)}</p></div>
          <button type="button" onClick={() => void loadParticipants(challenge.id)}>Load participants</button>
          {(participants[challenge.id] ?? []).map((entry) => (
            <div key={entry.id} className={styles.participant}>
              <strong>{entry.user.name}</strong>
              <span>{entry.progressPct}% · {entry.reviewStatus}</span>
              <button type="button" onClick={() => void api.reviewParticipant(challenge.id, entry.id, { isWinner: true, reviewStatus: "APPROVED", rewardPaid: true }).then(() => loadParticipants(challenge.id))}>Reward</button>
            </div>
          ))}
        </article>
      ))}
    </div>
  );
}

function UsersPanel({ users, refresh }: { users: ApiUser[]; refresh: () => void }) {
  const toggle = async (item: ApiUser) => {
    await api.blockUser(item.id, { isBlocked: !item.isBlocked, blockReason: item.isBlocked ? undefined : "Policy violation" });
    await refresh();
  };

  return (
    <div className={styles.panel}>
      <h2>Users</h2>
      <div className={styles.table}>
        {users.map((item) => (
          <article key={item.id} className={styles.rowCard}>
            <div><strong>{item.name}</strong><p>{item.email} · {item.role}</p></div>
            <p className={styles.meta}>{item.phone ?? "No phone"}</p>
            {item.role === "ADMIN" ? (
              <span className={styles.meta}>Protected admin</span>
            ) : (
              <button type="button" onClick={() => void toggle(item)}>
                {item.isBlocked ? "Unblock" : "Block"}
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

void ChallengesPanel;
void UsersPanel;

function ChallengesPanelV2({
  challenges,
  participants,
  loadParticipants,
  refresh,
}: {
  challenges: ApiChallenge[];
  participants: Record<string, Participant[]>;
  loadParticipants: (id: string) => Promise<void>;
  refresh: () => void | Promise<void>;
}) {
  const [editing, setEditing] = useState<ApiChallenge | null>(null);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE" | "ENDED">("DRAFT");
  const [search, setSearch] = useState("");
  const [picturePreview, setPicturePreview] = useState<{ url: string; label: string } | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    return end.toISOString().slice(0, 10);
  });

  const reset = () => {
    setEditing(null);
    setTitle("");
    setDetail("");
    setThumbnailUrl("");
    setStatus("DRAFT");
  };

  const edit = (challenge: ApiChallenge) => {
    setEditing(challenge);
    setTitle(challenge.title);
    setDetail(challenge.detail);
    setThumbnailUrl(challenge.thumbnailUrl ?? "");
    setStatus(challenge.status);
    setStartDate(challenge.startDate.slice(0, 10));
    setEndDate(challenge.endDate.slice(0, 10));
  };

  const save = async () => {
    const body = { title, detail, thumbnailUrl: thumbnailUrl || undefined, status, startDate, endDate };
    if (editing) await api.updateChallenge(editing.id, body);
    else await api.createChallenge(body);
    reset();
    await refresh();
  };
  const filteredChallenges = challenges.filter((challenge) => {
    const entries = participants[challenge.id] ?? [];
    return includesSearch([
      challenge.title,
      challenge.detail,
      challenge.status,
      challenge.startDate,
      challenge.endDate,
      challenge._count?.userChallenges,
      ...entries.flatMap((entry) => [
        entry.user.name,
        entry.user.email,
        entry.user.phone,
        entry.progressPct,
        entry.progressStatus,
        entry.reviewStatus,
        entry.pictures.length,
        entry.rewardPaidAt ? "rewarded" : "",
      ]),
    ], search);
  });

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h2>Challenges</h2>
          <p className={styles.meta}>Only one active challenge can overlap a date range. Use Ended to unactive.</p>
        </div>
      </div>
      <input className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search challenges, participants, email, status..." />
      <div className={styles.formRow}>
        <input placeholder="Challenge title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Thumbnail URL" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} />
        <input placeholder="Detail" value={detail} onChange={(e) => setDetail(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value as "DRAFT" | "ACTIVE" | "ENDED")}>
          <option value="DRAFT">DRAFT</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="ENDED">ENDED / unactive</option>
        </select>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button type="button" onClick={() => void save()} disabled={!title || !detail}>{editing ? "Update challenge" : "Create challenge"}</button>
        {editing && <button type="button" onClick={reset}>Cancel edit</button>}
      </div>
      <div className={styles.table}>
        {filteredChallenges.map((challenge) => (
          <article key={challenge.id} className={styles.marketCard}>
            {challenge.thumbnailUrl && <img className={styles.marketThumb} src={challenge.thumbnailUrl} alt="" />}
            <div>
              <strong>{challenge.title}</strong>
              <p>{challenge.status} - {challenge.startDate.slice(0, 10)} to {challenge.endDate.slice(0, 10)}</p>
              <p>{challenge.detail}</p>
              <p>{challenge._count?.userChallenges ?? 0} participants</p>
            </div>
            <div className={styles.actions}>
              <button type="button" onClick={() => edit(challenge)}>Detail / edit</button>
              {challenge.status === "ACTIVE" ? (
                <button type="button" onClick={() => void api.updateChallenge(challenge.id, { status: "ENDED" }).then(refresh)}>Unactive</button>
              ) : (
                <button type="button" onClick={() => void api.updateChallenge(challenge.id, { status: "ACTIVE" }).then(refresh)}>Activate</button>
              )}
              <button type="button" onClick={() => void loadParticipants(challenge.id)}>Participants</button>
            </div>
            {(participants[challenge.id] ?? []).map((entry) => {
                const hasBefore = entry.pictures.some((picture) => picture.kind === "BEFORE");
                const hasAfter = entry.pictures.some((picture) => picture.kind === "AFTER");
                const canReward = hasBefore && hasAfter;
                return (
                  <div key={entry.id} className={styles.participant}>
                    <div className={styles.participantInfo}>
                      <strong>{entry.user.name}</strong>
                      <span>{entry.user.email} - {entry.progressPct}% - {entry.progressStatus} - {entry.reviewStatus}</span>
                      <span>{entry.pictures.length} pictures{entry.rewardPaidAt ? " - Rewarded" : ""}</span>
                    </div>
                    <div className={styles.participantPictures}>
                      {entry.pictures.length === 0 ? (
                        <span className={styles.noPictures}>No pictures</span>
                      ) : (
                        entry.pictures.map((picture) => (
                          <button key={picture.id} type="button" className={styles.participantPicture} onClick={() => setPicturePreview({ url: picture.url, label: picture.kind })}>
                            <img src={picture.url} alt="" />
                            <span>{picture.kind}</span>
                          </button>
                        ))
                      )}
                    </div>
                    <div className={styles.participantActions}>
                      <button type="button" onClick={() => void api.reviewParticipant(challenge.id, entry.id, { reviewStatus: "APPROVED" }).then(() => loadParticipants(challenge.id))}>Approve progress</button>
                      <button type="button" onClick={() => void api.reviewParticipant(challenge.id, entry.id, { reviewStatus: "REJECTED", reviewNote: "Needs clearer before/after pictures" }).then(() => loadParticipants(challenge.id))}>Reject progress</button>
                      <button type="button" onClick={() => void api.reviewParticipant(challenge.id, entry.id, { isWinner: true, reviewStatus: "APPROVED", rewardPaid: true }).then(() => loadParticipants(challenge.id))} disabled={!canReward || Boolean(entry.rewardPaidAt)} title={canReward ? "Reward participant" : "Needs both BEFORE and AFTER pictures"}>Reward</button>
                    </div>
                  </div>
                );
              })}
          </article>
        ))}
      </div>
      {picturePreview && (
        <Modal title={picturePreview.label} onClose={() => setPicturePreview(null)} wide>
          <img className={styles.zoomImage} src={picturePreview.url} alt="" />
        </Modal>
      )}
    </div>
  );
}

function UsersPanelV2({ users, refresh }: { users: ApiUser[]; refresh: () => void | Promise<void> }) {
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("Policy violation");
  const [until, setUntil] = useState("");
  const [blockingUser, setBlockingUser] = useState<ApiUser | null>(null);

  const openBlock = (item: ApiUser) => {
    setBlockingUser(item);
    setReason(item.blockReason ?? "Policy violation");
    setUntil("");
  };

  const block = async () => {
    if (!blockingUser) return;
    const item = blockingUser;
    await api.blockUser(item.id, { isBlocked: true, blockReason: reason, blockedUntil: until || null });
    setBlockingUser(null);
    await refresh();
  };

  const unblock = async (item: ApiUser) => {
    await api.blockUser(item.id, { isBlocked: false });
    await refresh();
  };
  const filteredUsers = users.filter((item) => includesSearch([
    item.name,
    item.email,
    item.phone,
    item.role,
    item.isBlocked ? "blocked" : "active",
    item.blockReason,
    item.blockedUntil,
  ], search));

  return (
    <div className={styles.panel}>
      <h2>Users</h2>
      <input className={styles.searchInput} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users by name, email, phone, role, block status..." />
      <div className={styles.table}>
        {filteredUsers.map((item) => (
          <article key={item.id} className={styles.rowCard}>
            <div>
              <strong>{item.name}</strong>
              <p>{item.email} - {item.phone ?? "No phone"} - {item.role}</p>
              {item.isBlocked && <p>Blocked: {item.blockReason ?? "No reason"} {item.blockedUntil ? `until ${item.blockedUntil}` : ""}</p>}
            </div>
            {item.role === "ADMIN" ? (
              <span className={styles.meta}>Protected admin</span>
            ) : item.isBlocked ? (
              <button type="button" onClick={() => void unblock(item)}>Unblock</button>
            ) : (
              <button type="button" onClick={() => openBlock(item)}>Block</button>
            )}
          </article>
        ))}
      </div>
      {blockingUser && (
        <Modal title={`Block ${blockingUser.name}`} onClose={() => setBlockingUser(null)} wide>
          <div className={styles.editMediaForm}>
            <input placeholder="Block reason" value={reason} onChange={(e) => setReason(e.target.value)} />
            <input type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} />
            <button type="button" onClick={() => void block()} disabled={!reason.trim()}>Confirm block</button>
            <button type="button" onClick={() => setBlockingUser(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
