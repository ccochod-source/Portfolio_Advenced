import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { mergeDocuments, prune, dedup, unpartition } from '@gltf-transform/functions';
import { MeshoptDecoder } from 'meshoptimizer';
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
// node graft.mjs <scan.glb> <v2-source.glb> <v2-optimized.glb> <out.glb> [v2glasses]
// Keeps the scanned head + hair, grafts the v2 outfit (turtleneck, jeans, sneakers[, glasses]) onto the same Avaturn rig.
const [,, targetPath, sourcePath, texPath, outPath, glassesFlag] = process.argv;
const TAKE_GLASSES = glassesFlag === 'v2glasses';
const target = await io.read(targetPath);
const source = await io.read(sourcePath);
const texDoc = await io.read(texPath);
for (const sm of source.getRoot().listMaterials()) { const tm = texDoc.getRoot().listMaterials().find(m => m.getName() === sm.getName()); const st = sm.getBaseColorTexture(), tt = tm?.getBaseColorTexture(); if (st && tt) { st.setImage(tt.getImage()).setMimeType(tt.getMimeType()); console.log('texture from v2opt:', sm.getName()); } }
const tJoints = target.getRoot().listSkins()[0].listJoints().map(j => j.getName());
const sJoints = source.getRoot().listSkins()[0].listJoints().map(j => j.getName());
console.log('joints identical:', JSON.stringify(tJoints) === JSON.stringify(sJoints));
const map = mergeDocuments(target, source);
const tRoot = target.getRoot();
const tSkin = tRoot.listSkins()[0];
const tArmature = tRoot.listNodes().find(n => n.getName() === 'Armature' && n.listChildren().some(c => c.getMesh()?.getName() === 'avaturn_body' && c.getSkin() === tSkin));
const REMOVE = ['avaturn_look_0', 'avaturn_look_1', 'avaturn_shoes_0', ...(TAKE_GLASSES ? ['avaturn_glasses_0', 'avaturn_glasses_1'] : [])];
const TAKE = ['avaturn_look_0', 'avaturn_shoes_0', ...(TAKE_GLASSES ? ['avaturn_glasses_0', 'avaturn_glasses_1'] : [])];
// Blend body: keep the scanned head (above the collar), take the v2 body below it so the grafted clothes fit without clipping.
{
  const tBody = tRoot.listMeshes().find(m => m.getName() === 'avaturn_body').listPrimitives()[0];
  const sBody = map.get(source.getRoot().listMeshes().find(m => m.getName() === 'avaturn_body')).listPrimitives()[0];
  const sLook = map.get(source.getRoot().listMeshes().find(m => m.getName() === 'avaturn_look_0')).listPrimitives()[0];
  const collarTop = sLook.getAttribute('POSITION').getMax([])[1];
  const thr = collarTop - 0.012;
  const tP = tBody.getAttribute('POSITION'), sP = sBody.getAttribute('POSITION');
  const tN = tBody.getAttribute('NORMAL'), sN = sBody.getAttribute('NORMAL');
  console.log('body verts', tP.getCount(), sP.getCount(), 'collarTop', collarTop.toFixed(3));
  const tArr = tP.getArray().slice(), sArr = sP.getArray(); const tNArr = tN.getArray().slice(), sNArr = sN.getArray();
  let swapped = 0;
  for (let i = 0; i < tP.getCount(); i++) { if (tArr[i*3+1] < thr) { for (let k = 0; k < 3; k++) { tArr[i*3+k] = sArr[i*3+k]; tNArr[i*3+k] = sNArr[i*3+k]; } swapped++; } }
  tP.setArray(tArr); tN.setArray(tNArr); console.log('body verts taken from v2:', swapped);
}
for (const n of [...tArmature.listChildren()]) if (REMOVE.includes(n.getName())) { n.getMesh()?.dispose(); n.dispose(); }
for (const sn of source.getRoot().listNodes()) {
  if (!TAKE.includes(sn.getName())) continue;
  const n = map.get(sn);
  n.getParentNode()?.removeChild(n);
  n.setSkin(tSkin);
  tArmature.addChild(n);
  console.log('grafted', n.getName());
}
// drop the merged source scene & its armature
const scenes = tRoot.listScenes();
for (const s of scenes.slice(1)) { for (const c of [...s.listChildren()]) { c.traverse?.(x => x.dispose()); c.dispose(); } s.dispose(); }
for (const a of tRoot.listAnimations()) if (!target.getRoot().listScenes()[0]) a.dispose();
// remove any animation that came from the source (keep target's Idle)
const srcAnims = source.getRoot().listAnimations().map(a => map.get(a));
srcAnims.forEach(a => a?.dispose());
for (const sk of tRoot.listSkins()) if (sk !== tSkin) sk.dispose();
// Dispose every node not reachable from the kept scene (the merged source skeleton would otherwise survive as orphans with duplicate joint names).
{ const keep = new Set(); tRoot.listScenes()[0].traverse(n => keep.add(n)); let dropped = 0; for (const n of tRoot.listNodes()) if (!keep.has(n)) { n.dispose(); dropped++; } console.log('orphan nodes dropped:', dropped); }
await target.transform(prune(), dedup(), unpartition());
tRoot.getAsset().extras = { ...(tRoot.getAsset().extras ?? {}) };
for (const ext of tRoot.listExtensionsUsed()) if (ext.extensionName === 'EXT_meshopt_compression') ext.dispose();
await io.write(outPath, target);
console.log('nodes with mesh:', tRoot.listNodes().filter(n => n.getMesh()).map(n => n.getName()).join(', '));
console.log('anims:', tRoot.listAnimations().map(a => a.getName()).join(', '));
