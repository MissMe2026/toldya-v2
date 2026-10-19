ALTER TABLE public.artists ADD COLUMN source text NOT NULL DEFAULT 'demo', ADD COLUMN lastfm_url text, ADD COLUMN mbid text, ADD COLUMN tags text[], ADD COLUMN playcount bigint, ADD COLUMN deezer_id bigint, ADD COLUMN deezer_fans integer, ADD COLUMN last_synced_at timestamptz;
CREATE UNIQUE INDEX artists_lastfm_name_unique ON public.artists (lower(name)) WHERE source = 'lastfm';
CREATE INDEX artists_source_genre ON public.artists(source, genre);
CREATE TABLE public.artist_snapshots (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), artist_id uuid NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
 taken_on date NOT NULL, listeners integer NOT NULL CHECK (listeners >= 0), playcount bigint, deezer_fans integer,
 UNIQUE(artist_id,taken_on)
);
GRANT SELECT ON public.artist_snapshots TO anon, authenticated;
GRANT ALL ON public.artist_snapshots TO service_role;
ALTER TABLE public.artist_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Snapshots public read" ON public.artist_snapshots FOR SELECT TO anon, authenticated USING (true);
CREATE TABLE public.import_runs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind text NOT NULL CHECK(kind IN ('import','refresh')),
 status text NOT NULL DEFAULT 'running' CHECK(status IN ('running','paused','completed','failed')),
 progress jsonb NOT NULL DEFAULT '{}', errors jsonb NOT NULL DEFAULT '[]', processed integer NOT NULL DEFAULT 0,
 lease_token uuid, lease_until timestamptz, retry_after timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
GRANT ALL ON public.import_runs TO service_role;
ALTER TABLE public.import_runs ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX import_runs_one_active ON public.import_runs ((1)) WHERE status IN ('running','paused');
CREATE TABLE public.user_roles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 role text NOT NULL CHECK(role IN ('admin')), UNIQUE(user_id,role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own role" ON public.user_roles FOR SELECT TO authenticated USING(auth.uid()=user_id);
CREATE OR REPLACE FUNCTION public.claim_artist_run(p_id uuid, p_token uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 UPDATE public.import_runs SET lease_token=p_token, lease_until=now()+interval '90 seconds', updated_at=now()
 WHERE id=p_id AND status='running' AND (lease_until IS NULL OR lease_until < now()) AND (retry_after IS NULL OR retry_after<=now());
 RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.claim_artist_run(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_artist_run(uuid,uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.sync_snapshot_growth() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE current_row public.artist_snapshots; baseline public.artist_snapshots;
BEGIN
 SELECT * INTO current_row FROM public.artist_snapshots WHERE artist_id=NEW.artist_id ORDER BY taken_on DESC LIMIT 1;
 SELECT * INTO baseline FROM public.artist_snapshots WHERE artist_id=NEW.artist_id AND taken_on<current_row.taken_on
 ORDER BY CASE WHEN taken_on>=current_row.taken_on-30 THEN 0 ELSE 1 END,
 CASE WHEN taken_on>=current_row.taken_on-30 THEN taken_on END ASC, taken_on DESC LIMIT 1;
 UPDATE public.artists SET monthly_listeners=current_row.listeners, playcount=current_row.playcount, deezer_fans=current_row.deezer_fans,
 growth_rate=CASE WHEN baseline.listeners>0 THEN round((current_row.listeners-baseline.listeners)::numeric/baseline.listeners*100,4) ELSE 0 END,
 last_synced_at=now() WHERE id=NEW.artist_id AND source='lastfm';
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.sync_snapshot_growth() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER snapshot_growth AFTER INSERT OR UPDATE ON public.artist_snapshots FOR EACH ROW EXECUTE FUNCTION public.sync_snapshot_growth();
CREATE OR REPLACE FUNCTION public.save_real_artist(p_artist jsonb, p_day date) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE artist_id uuid;
BEGIN
 INSERT INTO public.artists(name,genre,city,bio,aura_mix,monthly_listeners,growth_rate,source,lastfm_url,mbid,tags,playcount,deezer_id,deezer_fans,last_synced_at)
 VALUES(p_artist->>'name',p_artist->>'genre','',p_artist->>'bio',p_artist->'aura_mix',(p_artist->>'monthly_listeners')::integer,0,'lastfm',p_artist->>'lastfm_url',p_artist->>'mbid',ARRAY(SELECT jsonb_array_elements_text(p_artist->'tags')),(p_artist->>'playcount')::bigint,(p_artist->>'deezer_id')::bigint,(p_artist->>'deezer_fans')::integer,now())
 ON CONFLICT (lower(name)) WHERE source='lastfm' DO UPDATE SET lastfm_url=EXCLUDED.lastfm_url,mbid=EXCLUDED.mbid,tags=EXCLUDED.tags,bio=EXCLUDED.bio,deezer_id=EXCLUDED.deezer_id
 RETURNING id INTO artist_id;
 INSERT INTO public.artist_snapshots(artist_id,taken_on,listeners,playcount,deezer_fans)
 VALUES(artist_id,p_day,(p_artist->>'monthly_listeners')::integer,(p_artist->>'playcount')::bigint,(p_artist->>'deezer_fans')::integer)
 ON CONFLICT(artist_id,taken_on) DO UPDATE SET listeners=EXCLUDED.listeners,playcount=EXCLUDED.playcount,deezer_fans=EXCLUDED.deezer_fans;
 RETURN artist_id;
END $$;
REVOKE ALL ON FUNCTION public.save_real_artist(jsonb,date) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_real_artist(jsonb,date) TO service_role;