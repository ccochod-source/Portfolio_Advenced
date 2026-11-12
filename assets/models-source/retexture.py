"""Recolour Avaturn textures so the outfit matches Clément's real clothes.

usage: python3 retexture.py <tex_dir>
  tex_dir must contain the base-colour textures extracted from the Avaturn export:
    avaturn_body_material_base.jpg, avaturn_look_0_material_base.jpg, avaturn_shoes_0_material_base.jpg
  writes body_inpaint.jpg (glasses frames baked by the photo scan removed),
  look_recolour.jpg (denim -> dark indigo) and shoes_recolour.jpg (black/white -> brown suede + gum sole).
"""
import sys, cv2, numpy as np

d = sys.argv[1].rstrip('/')

# --- face: the photo scan baked the real glasses into the skin texture; inpaint them away
im = cv2.imread(f'{d}/avaturn_body_material_base.jpg')
h, w = im.shape[:2]; oy = 380
box = (180, oy + 120, 355, oy + 490)
sub = im[box[1]:box[3], box[0]:box[2]]
lum = cv2.cvtColor(sub, cv2.COLOR_BGR2GRAY)
mask = cv2.dilate((lum < 115).astype(np.uint8) * 255, np.ones((7, 7), np.uint8))
for (cx, cy) in ((280, 225), (277, 344)):  # keep both irises
    cv2.circle(mask, (cx - box[0], oy + cy - box[1]), 22, 0, -1)
full = np.zeros((h, w), np.uint8); full[box[1]:box[3], box[0]:box[2]] = mask
im = cv2.inpaint(im, full, 9, cv2.INPAINT_TELEA)
# the second eye was mostly hidden by the frames: mirror the clean eye onto it
axis = oy + 284.5
y0, y1, x0, x1 = oy + 165, oy + 282, 215, 345
src = im[y0:y1, x0:x1][::-1]
dy0 = int(round(2 * axis - y1)); dy1 = dy0 + (y1 - y0)
m = np.zeros(src.shape[:2], np.float32)
cv2.ellipse(m, ((x1 - x0) // 2, (y1 - y0) // 2), ((x1 - x0) // 2 - 6, (y1 - y0) // 2 - 6), 0, 0, 360, 1, -1)
m = cv2.GaussianBlur(m, (31, 31), 0)[..., None]
im[dy0:dy1, x0:x1] = (src * m + im[dy0:dy1, x0:x1] * (1 - m)).astype(np.uint8)
cv2.imwrite(f'{d}/body_inpaint.jpg', im, [cv2.IMWRITE_JPEG_QUALITY, 95])

# --- jeans: medium blue -> dark indigo
look = cv2.imread(f'{d}/avaturn_look_0_material_base.jpg')
hsv = cv2.cvtColor(look, cv2.COLOR_BGR2HSV).astype(np.float32)
blue = (hsv[..., 0] > 90) & (hsv[..., 0] < 130) & (hsv[..., 1] > 40)
hsv[..., 0][blue] = np.clip(hsv[..., 0][blue] + 5, 0, 179)
hsv[..., 1][blue] = np.clip(hsv[..., 1][blue] * 1.15, 0, 255)
hsv[..., 2][blue] = hsv[..., 2][blue] * 0.52
cv2.imwrite(f'{d}/look_recolour.jpg', cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR), [cv2.IMWRITE_JPEG_QUALITY, 92])

# --- shoes: black upper -> brown suede, white sole/stripes -> gum
sh = cv2.imread(f'{d}/avaturn_shoes_0_material_base.jpg').astype(np.float32)
l = cv2.cvtColor(sh.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
brown = np.array([30, 62, 105], np.float32)   # BGR ≈ #693E1E
gum = np.array([110, 165, 205], np.float32)   # BGR ≈ #CDA56E
t = np.clip((l - 0.35) / 0.35, 0, 1)[..., None]
out = (brown * (1 - t) + gum * t) * (l[..., None] * 0.6 + 0.7)
cv2.imwrite(f'{d}/shoes_recolour.jpg', np.clip(out, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 92])
print('ok')

# --- hair: Avaturn's "brown" is auburn; pull it to chestnut / medium brown (textures are RGBA png)
for n in ('avaturn_hair_0_material_base.png', 'avaturn_hair_1_material_base.png'):
    hair = cv2.imread(f'{d}/{n}', cv2.IMREAD_UNCHANGED)
    if hair is None: continue
    hsv = cv2.cvtColor(hair[..., :3], cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 0] = np.clip(hsv[..., 0] + 6, 0, 179)
    hsv[..., 1] *= 0.88
    hsv[..., 2] *= 0.82
    hair[..., :3] = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    cv2.imwrite(f'{d}/{n.replace("_base", "_tint")}', hair)
