import React from "react";
import { ImageResponse } from "next/og";
import { getPublicInvitationBySlug } from "@/lib/repository";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ slug: string }>;
};

function splitTitle(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return ["Invitación Digital"];
  }

  if (words.length <= 3) {
    return [words.join(" ")];
  }

  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")];
}

export async function GET(request: Request, { params }: Params) {
  const { slug } = await params;

  let invitation = null;
  try {
    invitation = await getPublicInvitationBySlug(slug);
  } catch {
    invitation = null;
  }

  if (!invitation) {
    return new Response("Not found", { status: 404 });
  }

  const titleLines = splitTitle(invitation.share.og_title || invitation.sections.hero.title || "Invitación Digital");
  const subtitle = invitation.share.og_description || invitation.sections.hero.subtitle || "Celebremos juntos.";
  const requestHost = new URL(request.url).host;
  const eventDate = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(invitation.event_start_at));

  const wrapperStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    position: "relative",
    color: "#f8fbff",
    fontFamily: "Arial, sans-serif",
    backgroundImage:
      "radial-gradient(1200px 600px at 90% -10%, rgba(255, 255, 255, 0.08), transparent 58%), radial-gradient(900px 500px at -20% 10%, rgba(178, 219, 255, 0.08), transparent 56%), linear-gradient(180deg, #111318 0%, #0c0f15 100%)",
  };

  const panelStyle: React.CSSProperties = {
    position: "absolute",
    inset: 42,
    borderRadius: 30,
    border: "1px solid rgba(255, 255, 255, 0.16)",
    background:
      "linear-gradient(160deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02) 34%, rgba(255, 255, 255, 0.01)), rgba(17, 20, 28, 0.84)",
    boxShadow: "0 20px 52px rgba(0, 0, 0, 0.36)",
    display: "flex",
    flexDirection: "column",
    padding: "44px 48px",
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    fontWeight: 800,
    lineHeight: 1.05,
    letterSpacing: "-0.01em",
    fontSize: 76,
  };

  const subtitleStyle: React.CSSProperties = {
    marginTop: 20,
    fontSize: 34,
    color: "rgba(226, 235, 249, 0.94)",
    lineHeight: 1.28,
  };

  const footerStyle: React.CSSProperties = {
    marginTop: "auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 24,
    color: "rgba(203, 214, 230, 0.94)",
  };

  return new ImageResponse(
    React.createElement(
      "div",
      { style: wrapperStyle },
      React.createElement(
        "div",
        { style: panelStyle },
        React.createElement("div", { style: { fontSize: 20, letterSpacing: "0.24em", textTransform: "uppercase", color: "#d7deed" } }, "Invitación premium"),
        React.createElement(
          "h1",
          { style: titleStyle },
          ...titleLines.map((line, index) => React.createElement("span", { key: `title-${index}` }, line)),
        ),
        React.createElement("p", { style: subtitleStyle }, subtitle),
        React.createElement(
          "div",
          { style: footerStyle },
          React.createElement("span", null, eventDate),
          React.createElement("span", null, `${requestHost}/i/${invitation.slug}`),
        ),
      ),
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
