import {createServerFn} from '@tanstack/react-start';
import {getRequest} from '@tanstack/react-start/server';
import {requireSupabaseAuth} from '@/integrations/supabase/auth-middleware';
import {z} from 'zod';

export const manageArtistData=createServerFn({method:'POST'})
  .middleware([requireSupabaseAuth])
  .inputValidator(input=>z.object({action:z.enum(['start','refresh','report'])}).parse(input))
  .handler(async({data,context})=>{
    const role=await context.supabase.from('user_roles').select('role').eq('user_id',context.userId).eq('role','admin').maybeSingle();
    if(role.error || !role.data) throw new Error('Admin access required');
    const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
    const {artistJobReport,startArtistRun,continueArtistJob,dispatchArtistJob}=await import('./artist-jobs.server');
    if(data.action==='report') return artistJobReport(supabaseAdmin);
    if(!process.env['LASTFM_API_KEY']) throw new Error('LASTFM_API_KEY is not configured');
    const resumed=await supabaseAdmin.from('import_runs').update({status:'running',retry_after:null}).eq('status','paused');
    if(resumed.error) throw new Error('Could not resume artist data job');
    const run=await startArtistRun(supabaseAdmin,data.action==='start'?'import':'refresh');
    const request=getRequest();
    await dispatchArtistJob(request,continueArtistJob(supabaseAdmin,run.id,new URL(request.url).origin,20000));
    return {runId:run.id,status:'started'};
  });