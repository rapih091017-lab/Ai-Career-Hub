import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI Career Hub - Bangun Karier Impianmu dengan AI",
    short_name: "AI Career Hub",
    description:
      "Satu platform untuk membuat CV ATS-friendly, mengecek skor resume, dan membangun portofolio profesional secara instan.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf8fe",
    theme_color: "#0d7377",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["career", "productivity", "education"],
    lang: "id",
    dir: "ltr",
  };
}
