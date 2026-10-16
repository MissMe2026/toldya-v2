CREATE TABLE public.artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  genre text NOT NULL,
  city text NOT NULL,
  bio text NOT NULL,
  aura_mix jsonb NOT NULL,
  monthly_listeners integer NOT NULL,
  growth_rate numeric NOT NULL,
  callers_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.artists TO anon, authenticated;
GRANT ALL ON public.artists TO service_role;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Artists are public" ON public.artists FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.artists (name, genre, city, bio, aura_mix, monthly_listeners, growth_rate, callers_count) VALUES
('Vela Monroe','pop','Atlanta','Bedroom pop that sounds like a sleepover at 3am.','{"core":"ink","mid":"red","halo":"teal","shape":"orb","angle":30}',820,48,12),
('Kid Saffron','hip-hop','Houston','Slowed-down flows over church organ loops.','{"core":"oxblood","mid":"red","halo":"mint","shape":"capsule","angle":110}',4300,37,58),
('Nova Lark','r&b','Toronto','Velvet vocals, broken drum machines.','{"core":"ink","mid":"teal","halo":"mint","shape":"silhouette","angle":200}',12800,22,140),
('Paper Moths','indie','Glasgow','Jangly guitars and very specific heartbreak.','{"core":"red","mid":"oxblood","halo":"teal","shape":"orb","angle":75}',2100,31,33),
('Static Bloom','electronic','Berlin','Club tracks built from field recordings of trains.','{"core":"teal","mid":"ink","halo":"red","shape":"capsule","angle":160}',38500,14,410),
('Rue Dahlia','alt-rock','Detroit','Fuzz pedals, loud choruses, quiet verses.','{"core":"ink","mid":"oxblood","halo":"mint","shape":"orb","angle":250}',640,55,7),
('Lucia Fuego','latin','Medellín','Reggaeton with a bossa nova heartbeat.','{"core":"red","mid":"teal","halo":"mint","shape":"silhouette","angle":40}',71200,9,980),
('Hollis Creek','country','Nashville','Porch songs for people who moved to the city.','{"core":"oxblood","mid":"mint","halo":"teal","shape":"capsule","angle":320}',5600,18,61),
('Juno Vex','pop','Los Angeles','Hyperpop hooks with diary-entry lyrics.','{"core":"ink","mid":"red","halo":"mint","shape":"orb","angle":140}',27400,41,355),
('MC Tidewater','hip-hop','Baltimore','Harbor-town storytelling, boom-bap revival.','{"core":"teal","mid":"oxblood","halo":"red","shape":"silhouette","angle":10}',950,-3,4),
('Soleil Ash','r&b','Paris','Neo-soul in two languages and one mood.','{"core":"red","mid":"ink","halo":"teal","shape":"capsule","angle":280}',8900,27,97),
('The Lantern Kids','indie','Melbourne','Sunburnt surf rock with choir harmonies.','{"core":"mint","mid":"teal","halo":"red","shape":"orb","angle":190}',16300,6,120),
('Ohmra','electronic','Lagos','Afro-house at sunrise tempo.','{"core":"oxblood","mid":"red","halo":"teal","shape":"orb","angle":60}',3400,59,44),
('Glass Coyote','alt-rock','Albuquerque','Desert grunge recorded in a garage with no roof.','{"core":"ink","mid":"teal","halo":"red","shape":"capsule","angle":230}',22100,-5,210),
('Mar Celeste','latin','San Juan','Bolero ballads over trap 808s.','{"core":"teal","mid":"mint","halo":"red","shape":"silhouette","angle":100}',1200,44,19),
('Wren Halloway','country','Austin','Outlaw country with a synth in the back.','{"core":"red","mid":"oxblood","halo":"mint","shape":"orb","angle":350}',430,52,3),
('Bexley Rose','pop','London','Glossy synth-pop about bad decisions.','{"core":"oxblood","mid":"teal","halo":"mint","shape":"capsule","angle":20}',54800,12,620),
('Yung Atlas','hip-hop','Chicago','Drill energy, jazz-school chords.','{"core":"ink","mid":"red","halo":"teal","shape":"silhouette","angle":170}',9700,33,130),
('Ivory Sable','r&b','Oakland','Late-night slow jams, analog everything.','{"core":"mint","mid":"red","halo":"teal","shape":"orb","angle":300}',310,60,2),
('Fern & Fable','indie','Portland','Folk duo that whispers in harmony.','{"core":"teal","mid":"ink","halo":"mint","shape":"capsule","angle":80}',6800,-2,40),
('Kairo Pulse','electronic','Tokyo','Glitchy footwork made on a Game Boy.','{"core":"red","mid":"teal","halo":"mint","shape":"orb","angle":210}',88900,5,1240),
('Dead Letter Club','alt-rock','Manchester','Post-punk for people with feelings.','{"core":"oxblood","mid":"ink","halo":"teal","shape":"silhouette","angle":130}',1800,39,26),
('Rio Valente','latin','Mexico City','Corridos meets UK garage.','{"core":"ink","mid":"mint","halo":"red","shape":"capsule","angle":260}',19500,29,240),
('June Calloway','country','Tulsa','Heartland ballads with a punk heart.','{"core":"teal","mid":"red","halo":"mint","shape":"orb","angle":50}',2900,24,30),
('Pixie Riot','pop','Stockholm','Bubblegum chaos, 100 bpm minimum.','{"core":"red","mid":"mint","halo":"teal","shape":"silhouette","angle":330}',720,46,9),
('Saint Mercer','hip-hop','Atlanta','Gospel samples, trap drums, prayer-bars.','{"core":"oxblood","mid":"teal","halo":"red","shape":"orb","angle":90}',33600,17,300),
('Aria Noor','r&b','Dubai','Desert-cool R&B with oud flourishes.','{"core":"ink","mid":"teal","halo":"red","shape":"capsule","angle":150}',4800,35,52),
('Moonmilk','indie','Reykjavík','Dreamy shoegaze recorded in a lighthouse.','{"core":"mint","mid":"oxblood","halo":"teal","shape":"orb","angle":240}',560,1,5),
('Deltawave','electronic','Montréal','Ambient techno for long bus rides.','{"core":"teal","mid":"red","halo":"mint","shape":"silhouette","angle":0}',11400,26,105),
('Lola Cruz','latin','Miami','Salsa horns over bedroom beats.','{"core":"red","mid":"ink","halo":"mint","shape":"capsule","angle":120}',7300,42,88);