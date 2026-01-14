# Kaykit Character
[![npm](https://img.shields.io/badge/Sponsor-donate-blue?style=flat-square&logo=github)](https://github.com/sponsors/sketchpunklabs)
[![x](https://img.shields.io/badge/Twitter-profile-blue?style=flat-square&logo=x)](https://x.com/SketchpunkLabs)
[![youtube](https://img.shields.io/badge/Youtube-subscribe-red?style=flat-square&logo=youtube)](https://youtube.com/c/sketchpunklabs)
[![Ko-Fi](https://img.shields.io/badge/Ko_Fi-donate-orange?style=flat-square&logo=youtube)](https://ko-fi.com/sketchpunk)
[![Patreon](https://img.shields.io/badge/Patreon-donate-red?style=flat-square&logo=youtube)](https://www.patreon.com/sketchpunk)

### Demo

https://sketchpunklabs.github.io/kaykit_char/

### Repo Setup

```sh
git clone --recurse-submodules --depth=1 https://github.com/sketchpunklabs/kaykit_char
npm install
npm run dev
```

### Sources

Character & Animations<br>https://kaylousberg.itch.io/kaykit-character-animations

Props are random free bits from other kaykit packs<br>https://kaylousberg.itch.io

CRT Shader Tutural<br>https://babylonjs.medium.com/retro-crt-shader-a-post-processing-effect-study-1cb3f783afbc

### Changes
- Manny Character Mesh
  - Remodeled Head for better UV Space
  - Created & Applied CRT Face Material
- Animations
  - Re-exported from FBX to GLB to remove character mesh to decrease the file sizes

### Features
- How to load animations from external file & use the mixer to apply to character
- Function to clean the animation clip, remove all position  tracks minus those for root & hip. Only exception is the special pack to allow skeleton animations to work correctly. Also removes tracks for the handslot bone, animation skeleton has it but many does not have those bones. This removes warning of missing joints
- UI Built using Preact, Signals, deepSignal & HTM in a no-build way
- CRT Material that uses SDF shapes to generate faces procedurally
- Simple Slot system put in place to handle placement of props
- Task queue to manage loading in & out props using tweening on the scale of the models.
- Using Set's union & diff methods to easily organize which props to load in or load out.