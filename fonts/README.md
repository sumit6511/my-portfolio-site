# Fonts

Self-hosted so the site makes no third-party font requests.

| File | Family | Axis | Source |
| --- | --- | --- | --- |
| `manrope-latin.woff2`, `manrope-latin-ext.woff2` | Manrope | weight 500–800 (variable) | Google Fonts |
| `jetbrains-mono-latin.woff2`, `jetbrains-mono-latin-ext.woff2` | JetBrains Mono | weight 400–500 (variable) | Google Fonts |
| `space-grotesk-latin.woff2` | Space Grotesk | weight 300–700 (variable) | Google Fonts — used by `/v4/` |
| `archivo-black-latin.woff2` | Archivo Black | 400 | Google Fonts — used by `/v4/` |

Both families are licensed under the SIL Open Font License 1.1:
Manrope — https://github.com/sharanda/manrope
JetBrains Mono — https://github.com/JetBrains/JetBrainsMono
Space Grotesk — https://github.com/floriankarsten/space-grotesk
Archivo Black — https://github.com/Omnibus-Type/Archivo

The `@font-face` rules live at the top of `css/style.css` (and `v4/css/style.css` for the brutalist design); the latin files are preloaded from each page's `<head>`.
