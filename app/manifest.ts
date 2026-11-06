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
    icons: [
      {
        src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=192&h=192&q=80",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=512&h=512&q=80",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}