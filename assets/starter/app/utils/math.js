export const lerp = (from, to, amount) => from + (to - from) * amount

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

export const map = (value, inMin, inMax, outMin, outMax) =>
  outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin)

// Frame-rate independent lerp: damp(current, target, 8, deltaSeconds).
export const damp = (from, to, lambda, delta) => lerp(from, to, 1 - Math.exp(-lambda * delta))
