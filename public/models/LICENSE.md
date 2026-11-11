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
  `assets/models-source/make-clips.mjs` keeps Avaturn's own `Idle` clip and procedurally keyframes `SitIdle`,
  `Walk`, `Wave`, `Celebrate` on the Mixamo-compatible rig; `assets/models-source/optimize.mjs` runs gltf-transform
  (dedup, prune, resample, WebP 1024 textures, meshopt compression) → 1.7 MB.

## `avatar-poster.webp`

Static render of `avatar.glb` (Idle pose) taken from the `/[lang]/lab/avatar` page — same licence as above.

## Animation clips

Procedurally generated in this repository (no third-party motion-capture data) — same licence as the rest of the repo.
