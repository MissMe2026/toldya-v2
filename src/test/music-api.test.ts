import {afterEach,describe,expect,it,vi} from 'vitest';
import {musicApi} from '@/lib/music-api.server';
afterEach(()=>vi.unstubAllGlobals());
describe('music provider rules',()=>{
  it('takes unique listener counts from stats, not playcount or images',async()=>{
    const mock=vi.fn().mockResolvedValue(Response.json({artist:{name:'Real Act',url:'https://last.fm/music/Real+Act',mbid:'',stats:{listeners:'1234',playcount:'987654'},tags:{tag:[{name:'indie'}]},image:[{url:'unused'}],bio:{summary:'Never copied'}}}));
    vi.stubGlobal('fetch',mock);
    const info=await musicApi('test-only').info('Real Act');
    expect(info.listeners).toBe(1234);expect(info.playcount).toBe(987654);expect(info.tags).toEqual(['indie']);expect(info).not.toHaveProperty('image');expect(info).not.toHaveProperty('bio');
    expect(mock.mock.calls[0]?.[1].headers['User-Agent']).toBe('ToldYa/0.2');
  });
  it('rejects non-exact Deezer search matches',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({data:[{id:1,name:'Real Act Tribute'}]})));
    expect(await musicApi('test-only').deezer('Real Act')).toBeNull();
  });
  it('accepts exact case-insensitive names and fetches nb_fan from artist detail',async()=>{
    const mock=vi.fn().mockResolvedValueOnce(Response.json({data:[{id:42,name:'REAL ACT'}]})).mockResolvedValueOnce(Response.json({id:42,name:'Real Act',nb_fan:4567}));
    vi.stubGlobal('fetch',mock);
    expect(await musicApi('test-only').deezer('Real Act')).toEqual({id:42,fans:4567});
  });
  it('throttles Last.fm request starts to less than four per second',async()=>{
    const starts:number[]=[];
    vi.stubGlobal('fetch',vi.fn(async()=>{starts.push(Date.now());return Response.json({topartists:{artist:[]}});}));
    const api=musicApi('test-only');
    await api.candidates('pop',1);await api.candidates('pop',2);
    expect((starts[1]??0)-(starts[0]??0)).toBeGreaterThanOrEqual(250);
  });
  it('does not retry terminal invalid-key errors',async()=>{
    const mock=vi.fn().mockResolvedValue(Response.json({error:10}));vi.stubGlobal('fetch',mock);
    await expect(musicApi('test-only').info('Act')).rejects.toThrow('lastfm_error_10');expect(mock).toHaveBeenCalledTimes(1);
  });
});