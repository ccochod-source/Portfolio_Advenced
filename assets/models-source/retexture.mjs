// Extract base-colour textures from the Avaturn export, or swap the recoloured ones back in.
//   node retexture.mjs extract <in.glb> <tex_dir>
//   node retexture.mjs apply   <in.glb> <tex_dir> <out.glb>
import { NodeIO } from '@gltf-transform/core';
import fs from 'node:fs';

const [,, cmd, inPath, texDir, outPath] = process.argv;
const io = new NodeIO();
const doc = await io.read(inPath);
const swap = {
  avaturn_body_material: 'body_inpaint.jpg',
  avaturn_look_0_material: 'look_recolour.jpg',
  avaturn_shoes_0_material: 'shoes_recolour.jpg',
  avaturn_hair_0_material: 'avaturn_hair_0_material_tint.png',
  avaturn_hair_1_material: 'avaturn_hair_1_material_tint.png',
};
for (const mat of doc.getRoot().listMaterials()) {
  const tex = mat.getBaseColorTexture();
  if (!tex) continue;
  if (cmd === 'extract') {
    const ext = tex.getMimeType() === 'image/png' ? 'png' : 'jpg';
    fs.writeFileSync(`${texDir}/${mat.getName()}_base.${ext}`, Buffer.from(tex.getImage()));
  } else if (swap[mat.getName()]) {
    const file = swap[mat.getName()];
    tex.setImage(new Uint8Array(fs.readFileSync(`${texDir}/${file}`))).setMimeType(file.endsWith('.png') ? 'image/png' : 'image/jpeg');
    console.log('swapped', mat.getName());
  }
}
if (cmd === 'apply') await io.write(outPath, doc);
