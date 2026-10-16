import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — ToldYa" },
      { name: "description", content: "Who has the best ears? The ToldYa leaderboard." },
      { property: "og:title", content: "Leaderboard — ToldYa" },
      { property: "og:description", content: "Who has the best ears? The ToldYa leaderboard." },
    ],
  }),
  component: () => <Placeholder n="(3) RANKING" title={["Best", "Ears."]} word="RANK" note="Who heard it first · ranked by growth called" />,
});
