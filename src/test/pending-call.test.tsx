import { act, fireEvent, render, screen, cleanup } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  insert: vi.fn(), update: vi.fn(), eq: vi.fn(), success: vi.fn(),
  onSignedIn: undefined as undefined | ((user: { id: string }) => Promise<void>),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  useNavigate: () => vi.fn(), Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: mocks.success, error: vi.fn() } }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ insert: mocks.insert, update: mocks.update }) } }));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, ready: true }), useProfile: () => ({ data: undefined }),
  useMyCalls: () => ({ data: [] }),
  useArtists: () => ({ data: [{ id: "artist-1", name: "Pending Artist", genre: "pop", city: "Chicago", bio: "Music", monthly_listeners: 820, growth_rate: 60, callers_count: 12, aura_mix: {} }] }),
}));
vi.mock("@/hooks/useTryDemo", () => ({ useTryDemo: (options: { onSignedIn: typeof mocks.onSignedIn }) => {
  mocks.onSignedIn = options.onSignedIn;
  return { busy: false, tryDemo: async () => { await mocks.onSignedIn?.({ id: "new-judge" }); } };
} }));
vi.mock("@/components/Aura", () => ({ Aura: () => null }));
vi.mock("@/components/TabBar", () => ({ PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));

import { Route } from "@/routes/index";
const Discover = Route.options.component as ComponentType;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.insert.mockResolvedValue({ error: null });
  mocks.eq.mockReturnValue({ eq: mocks.eq, then: (resolve: (value: unknown) => void) => resolve({ error: null }) });
  mocks.update.mockReturnValue({ eq: mocks.eq });
});
afterEach(cleanup);

describe("Pending Discover call", () => {
  it("saves the selected artist with current listeners for the newly signed-in judge", async () => {
    render(<Discover />);
    fireEvent.click(screen.getByRole("button", { name: "Call it →" }));
    await act(async () => { fireEvent.click(screen.getByRole("dialog").querySelector("button:not([class*='absolute'])") as HTMLElement); });
    expect(mocks.insert).toHaveBeenCalledWith({ user_id: "new-judge", artist_id: "artist-1", listeners_at_call: 820, callers_at_call: 12 });
    expect(mocks.success).toHaveBeenCalledWith(expect.stringContaining("Called it. Pending Artist at 820"));
    expect(screen.getByText("CALLED ©")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Pending Artist" })).not.toBeInTheDocument();
  });

  it("refreshes an existing seeded receipt to current listeners without changing its Big Call star", async () => {
    mocks.insert.mockResolvedValue({ error: { code: "23505" } });
    render(<Discover />);
    fireEvent.click(screen.getByRole("button", { name: "Call it →" }));
    await act(async () => { await mocks.onSignedIn?.({ id: "new-judge" }); });
    expect(mocks.update).toHaveBeenCalledWith({ listeners_at_call: 820, callers_at_call: 12, called_at: expect.any(String) });
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "new-judge");
    expect(mocks.eq).toHaveBeenCalledWith("artist_id", "artist-1");
    expect(mocks.success).toHaveBeenCalled();
  });

  it("does not dismiss the sheet when auth finishes without a dismissal action", async () => {
    render(<Discover />);
    fireEvent.click(screen.getByRole("button", { name: "Call it →" }));
    await act(async () => { await mocks.onSignedIn?.({ id: "new-judge" }); });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});