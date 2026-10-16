CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle text NOT NULL UNIQUE,
  sim_months integer NOT NULL DEFAULT 0,
  genres text[] NOT NULL DEFAULT '{}',
  onboarded boolean NOT NULL DEFAULT false,
  top8 jsonb NOT NULL DEFAULT '[]',
  connected jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles public read" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE base text;
BEGIN
  base := lower(regexp_replace(coalesce(NEW.raw_user_meta_data->>'handle', split_part(NEW.email,'@',1)), '[^a-zA-Z0-9_]', '', 'g'));
  IF base = '' THEN base := 'listener'; END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE handle = base) THEN
    base := base || substr(replace(NEW.id::text,'-',''),1,4);
  END IF;
  INSERT INTO public.profiles (id, handle) VALUES (NEW.id, base);
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  artist_id uuid NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  listeners_at_call integer NOT NULL,
  called_at timestamptz NOT NULL DEFAULT now(),
  is_big_call boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, artist_id)
);
GRANT SELECT ON public.calls TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calls TO authenticated;
GRANT ALL ON public.calls TO service_role;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Calls public read" ON public.calls FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Own calls insert" ON public.calls FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own calls update" ON public.calls FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own calls delete" ON public.calls FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.bump_callers() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.artists SET callers_count = callers_count + 1 WHERE id = NEW.artist_id;
  RETURN NEW;
END $$;
CREATE TRIGGER on_call_created AFTER INSERT ON public.calls FOR EACH ROW EXECUTE FUNCTION public.bump_callers();

CREATE TABLE public.board_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handle text NOT NULL,
  score_all integer NOT NULL,
  score_week integer NOT NULL,
  calls integer NOT NULL,
  hits integer NOT NULL
);
GRANT SELECT ON public.board_users TO anon, authenticated;
GRANT ALL ON public.board_users TO service_role;
ALTER TABLE public.board_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Board public read" ON public.board_users FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.board_users (handle, score_all, score_week, calls, hits) VALUES
('cratedigga',9840,620,41,9),('earlybird.mp3',8710,410,33,8),('vinylvera',7520,880,29,6),('subwoofer_sam',6930,150,38,5),
('b4thehype',6210,540,22,6),('lofi_lena',5480,300,27,4),('nightbus',4920,710,19,4),('tapehiss',4400,90,24,3),
('mintcondition',3870,460,17,3),('kickdrum.kai',3310,220,21,2),('auxcord',2760,380,14,2),('redlight_rae',2240,130,12,2),
('basement.shows',1710,260,11,1),('demo_tape_dee',1180,70,9,1),('firstlisten',640,190,6,0);