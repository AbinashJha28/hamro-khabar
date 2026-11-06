import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hamro Khabar - Nepal News Portal",
    short_name: "Hamro Khabar",
    description: "Real-time Kathmandu & Nepal News Portal built with Next.js",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#dc2626",
    orientation: "portrait",
    icons: [
      {
        src: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=512&h=512&q=80",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      },
    ],
  };
}