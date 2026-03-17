// FNV-1a hash: string → uint32
function hashString(str) {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h
}

// Mulberry32 PRNG – returns a function yielding floats in [0, 1)
function mulberry32(seed) {
  let s = seed >>> 0
  return function () {
    s += 0x6d2b79f5
    let z = s
    z = Math.imul(z ^ (z >>> 15), z | 1)
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61)
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296
  }
}

// Fisher-Yates shuffle using a seeded PRNG – returns a new array
export function seededShuffle(arr, seedStr) {
  const rand = mulberry32(hashString(seedStr))
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Pick n items from arr using a reproducible seed
export function seededPick(arr, n, seedStr) {
  return seededShuffle(arr, seedStr).slice(0, Math.min(n, arr.length))
}
