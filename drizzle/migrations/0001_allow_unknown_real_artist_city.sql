ALTER TABLE public.artists ALTER COLUMN city DROP NOT NULL;
CREATE OR REPLACE FUNCTION public.save_real_artist(p_artist jsonb, p_day date) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE artist_id uuid;
BEGIN
 INSERT INTO public.artists(name,genre,city,bio,aura_mix,monthly_listeners,growth_rate,source,lastfm_url,mbid,tags,playcount,deezer_id,deezer_fans,last_synced_at)
 VALUES(p_artist->>'name',p_artist->>'genre',NULL,p_artist->>'bio',p_artist->'aura_mix',(p_artist->>'monthly_listeners')::integer,0,'lastfm',p_artist->>'lastfm_url',p_artist->>'mbid',ARRAY(SELECT jsonb_array_elements_text(p_artist->'tags')),(p_artist->>'playcount')::bigint,(p_artist->>'deezer_id')::bigint,(p_artist->>'deezer_fans')::integer,now())
 ON CONFLICT (lower(name)) WHERE source='lastfm' DO UPDATE SET lastfm_url=EXCLUDED.lastfm_url,mbid=EXCLUDED.mbid,tags=EXCLUDED.tags,bio=EXCLUDED.bio,deezer_id=EXCLUDED.deezer_id
 RETURNING id INTO artist_id;
 INSERT INTO public.artist_snapshots(artist_id,taken_on,listeners,playcount,deezer_fans)
 VALUES(artist_id,p_day,(p_artist->>'monthly_listeners')::integer,(p_artist->>'playcount')::bigint,(p_artist->>'deezer_fans')::integer)
 ON CONFLICT(artist_id,taken_on) DO UPDATE SET listeners=EXCLUDED.listeners,playcount=EXCLUDED.playcount,deezer_fans=EXCLUDED.deezer_fans;
 RETURN artist_id;
END $$;
REVOKE ALL ON FUNCTION public.save_real_artist(jsonb,date) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_real_artist(jsonb,date) TO service_role;