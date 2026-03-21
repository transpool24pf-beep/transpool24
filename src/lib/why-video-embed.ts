export type WhyVideoEmbed =
  | { kind: "none" }
  | { kind: "youtube"; src: string }
  | { kind: "vimeo"; src: string }
  | { kind: "file"; src: string };

/** Resolve YouTube/Vimeo/embed links or direct video file URLs for the “How it works” block. */
export function resolveWhyVideoEmbed(raw: string): WhyVideoEmbed {
  const u = raw.trim();
  if (!u) return { kind: "none" };

  if (/\.(mp4|webm)(\?|#|$)/i.test(u) || u.includes("/storage/v1/object/public/")) {
    return { kind: "file", src: u };
  }

  try {
    const url = new URL(u);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.replace(/^\//, "").split("/")[0];
      if (id) return { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}?rel=0` };
    }

    if (host.endsWith("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v) return { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${v}?rel=0` };
      const m = url.pathname.match(/\/embed\/([^/?]+)/);
      if (m) return { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0` };
    }

    if (host.endsWith("vimeo.com")) {
      const m = url.pathname.match(/\/(?:video\/)?(\d+)/);
      if (m) return { kind: "vimeo", src: `https://player.vimeo.com/video/${m[1]}` };
    }
  } catch {
    /* invalid URL */
  }

  return { kind: "none" };
}
