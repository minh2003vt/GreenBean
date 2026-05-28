export function getYouTubeEmbedUrl(rawUrl?: string | null) {
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, "");
    let id: string | null = null;

    if (host === "youtu.be") {
      id = url.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      if (url.pathname.startsWith("/embed/")) id = url.pathname.split("/")[2] ?? null;
      if (url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2] ?? null;
    }

    if (!id) return null;
    return `https://www.youtube.com/embed/${id}`;
  } catch {
    return null;
  }
}
