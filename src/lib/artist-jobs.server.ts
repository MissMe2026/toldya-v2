import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/integrations/supabase/types';
import { GENRE_TAGS, TIER_TARGETS, artistTier, eligibleArtist, nameKey, realArtistAura, type RealGenre } from './artist-data';
import { MusicApiError, musicApi } from './music-api.server';

type DB = SupabaseClient<Database>;
type Progress = { genre: number; page: number; queue: string[]; seen: string[]; similar: string[]; cursor: string; day: string };
const initial = (): Progress => ({ genre: 0, page: 1, queue: [], seen: [], similar: [], cursor: '', day: new Date().toISOString().slice(0,10) });
const genres = Object.keys(GENRE_TAGS) as RealGenre[];
type Run = Database['public']['Tables']['import_runs']['Row'];
const check = (error: { message: string } | null) => { if (error) throw new Error('artist_job_database_error'); };

export async function startArtistRun(db: DB, kind: 'import' | 'refresh') {
  const { data: active, error: activeError } = await db.from('import_runs').select('*').in('status',['running','paused']).maybeSingle(); check(activeError);
  if (active) return active;
  const { data, error } = await db.from('import_runs').insert({ kind, progress: initial() as unknown as Json }).select('*').single();
  if (error?.code === '23505') {
    const existing = await db.from('import_runs').select('*').in('status',['running','paused']).single(); check(existing.error);
    if (existing.data) return existing.data;
  }
  check(error); if (!data) throw new Error('artist_job_missing_run'); return data;
}

export async function artistJobReport(db: DB) {
  const { data, error } = await db.from('artists').select('genre,monthly_listeners').eq('source','lastfm').range(0,1999); check(error);
  const counts = Object.fromEntries(genres.map(g=>[g,{ big:0, mid:0, small:0, total:0 }]));
  for (const a of data ?? []) { const row=counts[a.genre]; if (row) { row[artistTier(a.monthly_listeners)]++; row.total++; } }
  const runs = await db.from('import_runs').select('id,kind,status,processed,errors,created_at,completed_at,retry_after').order('created_at',{ascending:false}).limit(5); check(runs.error);
  return { total: data?.length ?? 0, genres: counts, runs: runs.data ?? [] };
}

export async function runArtistChunk(db: DB, runId: string): Promise<{ pending: boolean; retryable?: boolean }> {
  const token=crypto.randomUUID();
  const { data: claimed,error: claimError }=await db.rpc('claim_artist_run',{ p_id:runId,p_token:token }); check(claimError);
  if (!claimed) return { pending:false };
  const read=await db.from('import_runs').select('*').eq('id',runId).single();
  if(read.error || !read.data) {
    await db.from('import_runs').update({lease_until:null,lease_token:null}).eq('id',runId).eq('lease_token',token);
    throw new Error('artist_job_missing_run');
  }
  const run: Run=read.data;
  const progress={ ...initial(), ...(run.progress as unknown as Partial<Progress>) };
  const errors = Array.isArray(run.errors) ? [...run.errors] : [];
  let status: Run['status']='running', retryAfter: string|null=null;
  const key=process.env['LASTFM_API_KEY'];
  if (!key) {
    const result=await db.from('import_runs').update({status:'paused',lease_token:null,lease_until:null,errors:[...errors,{code:'missing_LASTFM_API_KEY'}].slice(-100)}).eq('id',runId).eq('lease_token',token); check(result.error);
    return { pending:false };
  }
  const deadline=Date.now()+18_000, api=musicApi(key,deadline);
  let processed=run.processed;
  try {
    // One artist enrichment per chunk leaves room for retries within waitUntil's lifetime.
    for (let item=0; item<1 && Date.now()<deadline; item++) {
      if (run.kind==='refresh') {
        const next=await db.from('artists').select('id,name,deezer_id,deezer_fans').eq('source','lastfm').gt('id',progress.cursor || '00000000-0000-0000-0000-000000000000').order('id').limit(1); check(next.error);
        const artist=next.data?.[0]; if (!artist) { status='completed'; break; }
        const info=await api.info(artist.name);
        let fans=artist.deezer_fans;
        try { const d=await api.deezer(artist.name,artist.deezer_id); if(d) fans=d.fans; }
        catch { errors.push({code:'deezer_unavailable',artist:artist.name}); }
        const snapshot=await db.from('artist_snapshots').upsert({artist_id:artist.id,taken_on:progress.day,listeners:info.listeners,playcount:info.playcount,deezer_fans:fans},{onConflict:'artist_id,taken_on'}); check(snapshot.error);
        progress.cursor=artist.id; processed++;
      } else {
        const genre=genres[progress.genre]; if(!genre) { status='completed'; break; }
        const catalog=await db.from('artists').select('name,genre,monthly_listeners').eq('source','lastfm').range(0,1999); check(catalog.error);
        const known=(catalog.data ?? []).map(a=>a.name);
        const counts={big:0,mid:0,small:0};
        for(const a of catalog.data ?? []) if(a.genre===genre) counts[artistTier(a.monthly_listeners)]++;
        if(Object.entries(TIER_TARGETS).every(([tier,target])=>counts[tier as keyof typeof counts]>=target) || progress.page>250 && !progress.queue.length) {
          if(Object.entries(TIER_TARGETS).some(([tier,target])=>counts[tier as keyof typeof counts]<target)) errors.push({code:'genre_candidates_exhausted',genre,counts});
          progress.genre++; progress.page=1; progress.queue=[]; progress.seen=[]; progress.similar=[]; continue;
        }
        if(!progress.queue.length) {
          // Interleave near-top pages with increasingly deep pages. Tag rank is not listener rank.
          const page=progress.page % 2 ? Math.ceil(progress.page/2) : progress.page*2;
          progress.queue=await api.candidates(GENRE_TAGS[genre],page); progress.page++;
          progress.queue=progress.queue.filter(n=>!progress.seen.includes(nameKey(n)) && eligibleArtist(n,1000,known));
          if(!progress.queue.length) continue;
        }
        const candidate=progress.queue[0]; if(!candidate) continue;
        let info: Awaited<ReturnType<typeof api.info>>;
        try { info=await api.info(candidate); }
        catch(e) {
          if(e instanceof MusicApiError && e.code==='lastfm_error_6') { progress.queue.shift(); progress.seen.push(nameKey(candidate)); errors.push({code:'artist_not_found',artist:candidate}); continue; }
          throw e;
        }
        if(eligibleArtist(info.name,info.listeners,known)) {
          const tier=artistTier(info.listeners);
          if(tier==='mid' && !progress.similar.includes(nameKey(info.name)) && progress.similar.length<80 && counts.small<TIER_TARGETS.small) {
            const similar=await api.similar(info.name);
            progress.similar.push(nameKey(info.name));
            progress.queue.push(...similar.filter(n=>!progress.seen.includes(nameKey(n)) && eligibleArtist(n,1000,known)));
            progress.queue=[...new Set(progress.queue)].slice(0,500);
          }
          if(counts[tier]<TIER_TARGETS[tier]) {
            let deezer: {id:number;fans:number}|null=null;
            try { deezer=await api.deezer(info.name); }
            catch { errors.push({code:'deezer_unavailable',artist:info.name}); }
            const saved=await db.rpc('save_real_artist',{p_day:new Date().toISOString().slice(0,10),p_artist:{name:info.name,genre,bio:info.tags.slice(0,3).join(' · ') || genre,aura_mix:realArtistAura(info.name,genre),monthly_listeners:info.listeners,lastfm_url:info.url,mbid:info.mbid,tags:info.tags,playcount:info.playcount,deezer_id:deezer?.id ?? null,deezer_fans:deezer?.fans ?? null} as Json}); check(saved.error);
          }
        }
        progress.queue.shift(); progress.seen.push(nameKey(candidate)); processed++;
      }
      // Persist cursor after every completed item; writes and snapshots are idempotent on retries.
      const saved=await db.from('import_runs').update({progress:progress as unknown as Json,processed,errors:errors.slice(-100),updated_at:new Date().toISOString()}).eq('id',runId).eq('lease_token',token); check(saved.error);
    }
  } catch(e) {
    const code=e instanceof MusicApiError ? e.code : 'artist_job_internal_error';
    errors.push({code});
    status='paused';
    if(e instanceof MusicApiError && e.retryable) retryAfter=new Date(Date.now()+60_000).toISOString();
  }
  const done=await db.from('import_runs').update({progress:progress as unknown as Json,processed,status,errors:errors.slice(-100),retry_after:retryAfter,lease_token:null,lease_until:null,updated_at:new Date().toISOString(),completed_at:status==='completed'?new Date().toISOString():null}).eq('id',runId).eq('lease_token',token); check(done.error);
  return { pending:status==='running',retryable:!!retryAfter };
}

const allowedOrigins = new Set(['http://localhost:8080','https://id-preview--c379627d-21a4-4a00-a6d8-707fe538dfbf.lovable.app','https://project--c379627d-21a4-4a00-a6d8-707fe538dfbf-dev.lovable.app','https://project--c379627d-21a4-4a00-a6d8-707fe538dfbf.lovable.app']);
export async function continueArtistJob(db: DB, runId: string, origin: string, remaining: number) {
  const result=await runArtistChunk(db,runId);
  if(!result.pending || remaining<=0) return;
  if(!allowedOrigins.has(origin)) throw new Error('artist_job_origin_not_allowed');
  const credential=process.env['LOVABLE_CRON_SECRET'];
  if(!credential) throw new Error('artist_job_scheduler_not_configured');
  await new Promise(resolve=>setTimeout(resolve,500));
  // Each bounded hop has its own lifetime. Never forward credentials to arbitrary Host headers.
  try {
    const response=await fetch(`${origin}/api/public/jobs/artists`,{method:'POST',headers:{'content-type':'application/json',Authorization:`Bearer ${credential}`},body:JSON.stringify({action:'continue',runId,remaining:remaining-1}),signal:AbortSignal.timeout(5000)});
    await response.body?.cancel();
    if(!response.ok) throw new Error('continuation_failed');
  } catch {
    // Never replace errors or pause a lease now owned by another worker.
    const current=await db.from('import_runs').select('errors').eq('id',runId).is('lease_token',null).eq('status','running').maybeSingle(); check(current.error);
    if(current.data) {
      const prior=Array.isArray(current.data.errors)?current.data.errors:[];
      const saved=await db.from('import_runs').update({status:'paused',retry_after:new Date(Date.now()+60_000).toISOString(),errors:[...prior,{code:'continuation_failed'}].slice(-100)}).eq('id',runId).is('lease_token',null).eq('status','running'); check(saved.error);
    }
  }
}

export async function dispatchArtistJob(request: Request, work: Promise<unknown>): Promise<void> {
  const req=request as Request & {waitUntil?: (work:Promise<unknown>)=>void};
  if(req.waitUntil) req.waitUntil(work);
  else await work; // Local development awaits work rather than dropping an untracked promise.
}