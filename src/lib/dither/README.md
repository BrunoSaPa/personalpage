# dithercn

Engine and DitherText component from https://dithercn.dev, https://github.com/opencoredev/dithercn (MIT). Retrieved 2026-10-26.

Local adaptations: relative module imports, native CSS in place of Tailwind utility classes, and a local root ref for React 18. Threshold sampling and tone quantization are extracted without changing their math, so the WebGL background and the Three.js live-image adapter share the same engine. Only engine dependencies used by this page are included.

DitherText can apply its fill directly to a ref-forwarding child with `asChild`, avoiding Safari's nested text clipping issue. Real text stays readable before a texture decodes and if texture rendering fails.
