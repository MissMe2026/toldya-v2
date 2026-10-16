import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — ToldYa" },
      { name: "description", content: "Your ToldYa profile, badges and Top 8." },
      { property: "og:title", content: "Profile — ToldYa" },
      { property: "og:description", content: "Your ToldYa profile, badges and Top 8." },
    ],
  }),
  component: () => <Placeholder n="(4) YOU" title={["You", "Heard", "It First."]} word="TOLD YA" note="Badges · Top 8 · taste profile" />,
});
