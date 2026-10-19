import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth';

const Body=z.discriminatedUnion('action',[
  z.object({action:z.literal('daily')}),
  z.object({action:z.literal('start')}),
  z.object({action:z.literal('report')}),
  z.object({action:z.literal('continue'),runId:z.string().uuid(),remaining:z.number().int().min(0).max(20000)}),
]);
export const Route=createFileRoute('/api/public/jobs/artists')({
  server:{handlers:{POST:async({request})=>{
    const failure=await authenticateCronRequest(request); if(failure) return failure;
    const parsed=Body.safeParse(await request.json().catch(()=>null));
    if(!parsed.success) return Response.json({error:'Invalid job request'},{status:400});
    const {supabaseAdmin}=await import('@/integrations/supabase/client.server');
    const {startArtistRun,artistJobReport,continueArtistJob,dispatchArtistJob}=await import('@/lib/artist-jobs.server');
    if(parsed.data.action==='report') return Response.json(await artistJobReport(supabaseAdmin),{headers:{'cache-control':'no-store'}});
    let runId: string, remaining: number;
    if(parsed.data.action==='continue') {runId=parsed.data.runId; remaining=parsed.data.remaining;}
    else {
      if(!process.env['LASTFM_API_KEY']) return Response.json({error:'LASTFM_API_KEY is not configured'},{status:503});
      // Resume transient pauses only; credentials/access denials require explicit owner restart.
      if(parsed.data.action==='daily') {
        const resumed=await supabaseAdmin.from('import_runs').update({status:'running',retry_after:null}).eq('status','paused').lte('retry_after',new Date().toISOString());
        if(resumed.error) return Response.json({error:'Could not resume job'},{status:500});
      } else {
        const resumed=await supabaseAdmin.from('import_runs').update({status:'running',retry_after:null}).eq('status','paused');
        if(resumed.error) return Response.json({error:'Could not resume job'},{status:500});
      }
      const previous=await supabaseAdmin.from('import_runs').select('id').eq('kind','import').eq('status','completed').limit(1);
      if(previous.error) return Response.json({error:'Could not read import history'},{status:500});
      const run=await startArtistRun(supabaseAdmin,parsed.data.action==='start' || !previous.data?.length ? 'import':'refresh');
      if(run.status==='paused') return Response.json({runId:run.id,status:'paused'},{status:409});
      runId=run.id; remaining=20000;
    }
    const work=continueArtistJob(supabaseAdmin,runId,new URL(request.url).origin,remaining);
    await dispatchArtistJob(request,work);
    return Response.json({runId,accepted:true},{status:202,headers:{'cache-control':'no-store'}});
  }}},
});