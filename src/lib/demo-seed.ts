export const DEMO_CALLS = [
  { name: "Ohmra", daysAgo: 59, big: true, callers: 12 },
  { name: "Rue Dahlia", daysAgo: 34, big: true, callers: 3 },
  { name: "Hollis Creek", daysAgo: 9, big: false, callers: 40 },
  { name: "Static Bloom", daysAgo: 48, big: true, callers: 260 },
  { name: "Glass Coyote", daysAgo: 32, big: false, callers: 180 },
  { name: "The Lantern Kids", daysAgo: 4, big: false, callers: 110 },
];

export function historicalListeners(listeners: number, growthRate: number, daysAgo: number) {
  return Math.max(50, Math.round(listeners / Math.pow(1 + growthRate / 100, daysAgo / 30)));
}

function randomCode(length: number) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  while (code.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length * 2));
    for (const byte of bytes) {
      if (byte < 252 && code.length < length) code += alphabet[byte % alphabet.length];
    }
  }
  return code;
}

export function newDemoIdentity() {
  return { email: `demo+${randomCode(6)}@toldya.app`, handle: `demo_${randomCode(4)}`, password: randomCode(32) };
}