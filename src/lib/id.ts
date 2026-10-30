/**
 * ID unik untuk item CV (pengalaman, skill, dll.). Date.now() bisa bentrok
 * bila dua item dibuat di milidetik yang sama, dan React key ikut bentrok.
 */
export function newId(prefix?: string): string {
  let raw: string;
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === "function") {
    raw = c.randomUUID();
  } else if (c && typeof c.getRandomValues === "function") {
    // Konteks tidak aman (http) tidak punya randomUUID, tapi getRandomValues ada.
    const bytes = c.getRandomValues(new Uint8Array(16));
    raw = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  } else {
    raw = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${(counter++).toString(36)}`;
  }
  return prefix ? `${prefix}_${raw}` : raw;
}

let counter = 0;
