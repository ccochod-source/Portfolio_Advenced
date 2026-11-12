# 3D avatar assets — licence & provenance

## `avatar.glb` (source export kept in `assets/models-source/`)

- **Created with:** [Avaturn](https://avaturn.me) (Goodsize Inc.) — photo-to-avatar generator, then customised in the
  Avaturn editor (medium-length textured brown hair, black square glasses, black turtleneck, jeans, low-top sneakers) to
  match Clément Cochod.
  Ready Player Me was tried first but its domains were unreachable from the build environment.
- **Subject:** Clément Cochod, from his own photos — he is the licensee/owner of the avatar.
- **Avaturn Terms of Use** (https://avaturn.me/terms, "4. Usage", read on 2026-11-11): once created, the avatar may be
  used by its owner in any environment, subject to:
  - **Attribution** — give appropriate credit and a link to Avaturn, and indicate if changes were made.
    → This file is the attribution: *Avatar generated with [Avaturn](https://avaturn.me); modified
    (outfit/hair/glasses chosen in the editor, textures recoloured, procedural animation clips added, mesh/texture compression
    applied).*
  - **Commercial use** — allowed only after notifying hello@avaturn.me with a link to the project.
    A personal portfolio used to find an apprenticeship is personal, non-commercial use; if the site ever becomes
    commercial, send that notification first.
- **Modifications (v3):** `assets/models-source/avatar-avaturn-scan.glb` is Clément's own Avaturn phone scan (head, hair, body); `assets/models-source/graft.mjs` keeps that head/hair and grafts the outfit meshes (turtleneck, jeans, sneakers, glasses) of the earlier export `avatar-avaturn-idle.glb` onto the same rig, taking the v2 body vertices below the collar so the clothes fit. `assets/models-source/retexture.mjs` + `assets/models-source/retexture.py` recolour the base-colour textures (denim → dark indigo,
  sneakers → brown suede with gum sole, hair → chestnut) and inpaint the glasses frames the photo scan baked into the skin;
  `assets/models-source/make-clips.mjs` retargets the third-party motion-capture clips listed under
  "Animation clips" below onto the Mixamo-compatible rig; `assets/models-source/optimize.mjs` runs gltf-transform
  (dedup, prune, resample, WebP 1024 textures, meshopt compression) → 1.5 MB.

## `avatar-poster.webp`

Static render of the hero set (`avatar.glb` in the `Typing` pose on the procedural cloud, MacBook on the lap, transparent
background) — same licence as above. Shown under `prefers-reduced-motion` and while the 3D bundle loads.

## `../textures/sky-golden-hour.webp`

Equirectangular sunset sky sampled by the hero sky dome (`SkyDome.tsx`: drifting cloud layer + pointer ripples) and
used as environment light. Source: **"Belfast Sunset (Pure Sky)"** by Greg Zaal / Poly Haven,
https://polyhaven.com/a/belfast_sunset_puresky — licence **CC0 1.0** (public domain, no attribution required; credit
given anyway). Derived from Poly Haven's 8k tonemapped JPG: downscaled to 2048×1024 and re-graded to the portfolio's
warm palette (contrast-stretched luminance mapped through a coral → sun → gold → cream gradient, 40 % of the original
chroma kept for the cloud detail), saved as WebP (~46 KB).

## `../textures/cloud-{1,2,3}.webp`

Soft-alpha cloud billboards (drifting layers of the hero sky and the CSS fallback). Procedurally generated for this
project (fractal value noise shaped into cumulus silhouettes, warm shading) — no third-party asset, same licence as the
site code.

## Animation clips

The six clips baked into `avatar.glb` are real humanoid motion-capture / keyframed animations from two
third-party libraries, retargeted onto the Avaturn rig by `assets/models-source/make-clips.mjs`
(world-space rotation retargeting onto the rig's T-pose bind pose, hips translation scaled to the rig,
feet snapped to the floor, loops closed, root motion stripped on `Walk`, `Wave`/`Celebrate` eased from/to
the `Idle` first frame). No Avaturn, Mixamo or Ready Player Me animation data is used.

| Clip in app | Source clip | Library |
|---|---|---|
| `Idle` | `Idle_Loop` | Quaternius UAL 1 |
| `SitIdle` | `Sitting_Idle_Loop` | Quaternius UAL 1 |
| `Walk` | `Walk_Loop` (non-root-motion variant, Hips XZ stripped) | Quaternius UAL 1 |
| `Wave` | `dataset-2_wave-right-hand_normal_001.bvh` (0–2.2 s + 5.0 s–end spliced) | Bandai Namco Research Motiondataset-2 |
| `Celebrate` | `dataset-2_raise-up-both-hands_active_002.bvh` | Bandai Namco Research Motiondataset-2 |
| `Typing` | `Sitting_Idle_Loop` + procedural overlay (torso/head pitched towards the lap, two-bone IK placing both hands over the keyboard, alternating key taps; `TYPING` in `make-clips.mjs`) | Quaternius UAL 1 |

- **Quaternius — Universal Animation Library (UAL 1), Standard edition.** File used:
  `Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb` (UE5-Mannequin-named skeleton),
  downloaded from https://quaternius.itch.io/universal-animation-library (also https://quaternius.com/packs/universalanimationlibrary.html).
  Licence: **CC0 1.0 Universal** (public domain dedication) as stated in the pack's `License.txt` and on
  https://quaternius.com/license.html — no attribution required; credit given anyway: "Animations by Quaternius".
  The 16 MB source GLB is not committed; `make-clips.mjs --ual <path>` points to it.
- **Bandai Namco Research Inc. — Bandai-Namco-Research-Motiondataset-2.** Files used (committed as-is in
  `assets/models-source/mocap/`): `dataset-2_wave-right-hand_normal_001.bvh`, `dataset-2_raise-up-both-hands_active_002.bvh`,
  from https://github.com/BandaiNamcoResearchInc/Bandai-Namco-Research-Motiondataset
  (`dataset/Bandai-Namco-Research-Motiondataset-2/data/`). Licence: **CC BY-NC 4.0**
  (https://creativecommons.org/licenses/by-nc/4.0/, copy in `assets/models-source/mocap/LICENSE-Bandai-Namco-Research-Motiondataset-2.txt`).
  © 2022 Bandai Namco Research Inc. Attribution: "Motion data: Bandai-Namco-Research-Motiondataset-2 by Bandai Namco
  Research Inc., CC BY-NC 4.0, retargeted and trimmed". Paper: Kobayashi et al., *Motion Capture Dataset for Practical
  Use of AI-based Motion Editing and Stylization*, arXiv:2306.08861. **Non-commercial only**: this personal portfolio is
  non-commercial; if the site ever becomes commercial, replace `Wave`/`Celebrate` with clips under a commercial-friendly licence.
