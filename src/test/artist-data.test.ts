import {describe,it,expect} from 'vitest';
import {GENRE_TAGS,TIER_TARGETS,artistTier,eligibleArtist,realArtistAura,snapshotGrowth} from '@/lib/artist-data';
describe('real artist data rules',()=>{
  it('maps ToldYa genre keys to Last.fm tags',()=>expect(GENRE_TAGS).toEqual({pop:'pop','hip-hop':'hip-hop','r&b':'rnb',latin:'latin',indie:'indie',electronic:'electronic','alt-rock':'alternative rock',country:'country'}));
  it('targets 20 big, 45 mid and 60 small per genre',()=>expect(TIER_TARGETS).toEqual({big:20,mid:45,small:60}));
  it('uses listener tier boundaries at 50K and 1M',()=>expect([49999,50000,999999,1000000].map(artistTier)).toEqual(['small','mid','mid','big']));
  it('rejects fewer than 1000 listeners',()=>{expect(eligibleArtist('Act',999)).toBe(false);expect(eligibleArtist('Act',1000)).toBe(true);});
  it('rejects featured junk and unknown acts',()=>{for(const name of ['Various Artists','[unknown]','Act feat. Other'])expect(eligibleArtist(name,5000)).toBe(false);});
  it('deduplicates across genres and rejects ampersand composites of known acts',()=>{expect(eligibleArtist('ACT',5000,['Act'])).toBe(false);expect(eligibleArtist('Act & Other',5000,['Act'])).toBe(false);expect(eligibleArtist('Earth, Wind & Fire',5000,[])).toBe(true);});
  it('makes deterministic cool palette auras without provider images',()=>{const aura=realArtistAura('Act','pop');expect(aura).toEqual(realArtistAura('Act','pop'));expect(aura).not.toEqual(realArtistAura('Other','pop'));expect(aura.core).toBe('ink');expect(['teal','deep-teal']).toContain(aura.mid);expect(['mint','grey']).toContain(aura.halo);});
  it('uses zero growth until two distinct observations exist',()=>expect(snapshotGrowth([{taken_on:'2026-10-19',listeners:1000}])).toBe(0));
  it('uses earliest observation for less than 30 days of history',()=>expect(snapshotGrowth([{taken_on:'2026-10-01',listeners:1000},{taken_on:'2026-10-19',listeners:1500}])).toBe(50));
  it('uses the 30-day window rather than lifetime growth',()=>expect(snapshotGrowth([{taken_on:'2026-08-01',listeners:100},{taken_on:'2026-09-19',listeners:1000},{taken_on:'2026-10-19',listeners:2000}])).toBe(100));
});