import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/Placeholder";

export const Route = createFileRoute("/calls")({
  head: () => ({
    meta: [
      { title: "My Calls — ToldYa" },
      { name: "description", content: "Your receipts: every artist you called before the hype." },
      { property: "og:title", content: "My Calls — ToldYa" },
      { property: "og:description", content: "Your receipts: every artist you called before the hype." },
    ],
  }),
  component: () => <Placeholder n="(2) RECEIPTS" title={["My", "Calls."]} word="RECEIPTS" note="Listeners then vs. now · growth multiplier · top 3 big calls" />,
});
