import { ImageResponse } from "next/og";
import { createElement } from "react";

export const runtime = "edge";

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

function clampText(input: string, maxLength: number, fallback: string) {
  const normalized = (input || "").trim().replace(/\s+/g, " ");
  if (!normalized) {
    return fallback;
  }
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function resolveImageUrl(raw: string, requestUrl: URL) {
  const candidate = (raw || "").trim();
  if (!candidate) {
    return "";
  }

  try {
    const absolute = new URL(candidate, requestUrl.origin);
    if (absolute.protocol !== "http:" && absolute.protocol !== "https:") {
      return "";
    }
    return absolute.toString();
  } catch {
    return "";
  }
}

function isSelfReferencingOgImage(imageUrl: string, requestUrl: URL) {
  if (!imageUrl) {
    return false;
  }

  try {
    const parsed = new URL(imageUrl, requestUrl.origin);
    return parsed.origin === requestUrl.origin && parsed.pathname.startsWith("/api/public/og-card");
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const title = clampText(requestUrl.searchParams.get("title") || "", 90, "Invitación digital");
  const description = clampText(
    requestUrl.searchParams.get("description") || "",
    160,
    "Comparte todos los detalles del evento en un solo enlace.",
  );
  const rawImageUrl = resolveImageUrl(requestUrl.searchParams.get("image") || "", requestUrl);
  const imageUrl = isSelfReferencingOgImage(rawImageUrl, requestUrl) ? "" : rawImageUrl;
  const hostLabel = requestUrl.host.replace(/^www\./i, "");

  return new ImageResponse(
    createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#0f172a",
          color: "#ffffff",
          fontFamily: "Arial, sans-serif",
        },
      },
      [
        imageUrl
          ? createElement("img", {
              key: "hero-image",
              src: imageUrl,
              alt: "",
              style: {
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
              },
            })
          : null,
        createElement("div", {
          key: "overlay",
          style: {
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(110deg, rgba(5, 10, 22, 0.92) 0%, rgba(8, 16, 34, 0.86) 44%, rgba(11, 20, 42, 0.78) 100%)",
          },
        }),
        createElement("div", {
          key: "light",
          style: {
            position: "absolute",
            width: "700px",
            height: "700px",
            right: "-220px",
            top: "-260px",
            borderRadius: "999px",
            background: "radial-gradient(circle, rgba(118, 247, 255, 0.25) 0%, rgba(118, 247, 255, 0) 72%)",
          },
        }),
        createElement(
          "div",
          {
            key: "content",
            style: {
              position: "relative",
              zIndex: 2,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "100%",
              height: "100%",
              padding: "56px 64px",
            },
          },
          [
            createElement(
              "div",
              {
                key: "tag",
                style: {
                  display: "inline-flex",
                  width: "fit-content",
                  borderRadius: "999px",
                  border: "1px solid rgba(125, 211, 252, 0.45)",
                  background: "rgba(15, 23, 42, 0.46)",
                  color: "#7dd3fc",
                  fontSize: "28px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "10px 20px",
                },
              },
              "Invitación digital",
            ),
            createElement(
              "div",
              {
                key: "copy",
                style: {
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  maxWidth: "840px",
                },
              },
              [
                createElement(
                  "div",
                  {
                    key: "title",
                    style: {
                      fontSize: "74px",
                      fontWeight: 800,
                      lineHeight: 1.03,
                      letterSpacing: "0.01em",
                    },
                  },
                  title,
                ),
                createElement(
                  "div",
                  {
                    key: "description",
                    style: {
                      fontSize: "34px",
                      fontWeight: 500,
                      lineHeight: 1.28,
                      color: "rgba(229, 239, 255, 0.92)",
                    },
                  },
                  description,
                ),
              ],
            ),
            createElement(
              "div",
              {
                key: "footer",
                style: {
                  fontSize: "26px",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  color: "rgba(191, 219, 254, 0.95)",
                },
              },
              hostLabel,
            ),
          ],
        ),
      ],
    ),
    {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
