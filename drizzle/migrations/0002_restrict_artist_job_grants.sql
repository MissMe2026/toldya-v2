REVOKE ALL ON public.artist_snapshots FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.artist_snapshots TO anon,authenticated;
GRANT ALL ON public.artist_snapshots TO service_role;
REVOKE ALL ON public.import_runs FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.import_runs TO service_role;
REVOKE ALL ON public.user_roles FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;