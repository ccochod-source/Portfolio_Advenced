/**
 * Paints a DOM block onto a 2D canvas, word by word, from the computed styles and the client rects
 * (text, solid backgrounds, top borders). Used by the hero zoom to show "the next page" on the laptop
 * screen with the exact layout the real DOM will have once the canvas hands over to it.
 * Coordinates: page CSS px, origin = top-left of `root`; the caller sets the canvas transform.
 */

export type PaintedPage = {
  /** Right edge / vertical centre of the last word of `[data-zoom-caret]` (or of the first h2), page px. */
  caret: { x: number; y: number; height: number } | null;
};

const WORD = /\S+/g;

function alpha(color: string) {
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return color === "transparent" ? 0 : 1;
  const parts = m[1].split(/[\s,/]+/).filter(Boolean);
  return parts.length > 3 ? Number.parseFloat(parts[3]) : 1;
}

function transformText(text: string, mode: string) {
  if (mode === "uppercase") return text.toUpperCase();
  if (mode === "lowercase") return text.toLowerCase();
  if (mode === "capitalize") return text.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
  return text;
}

type Ctx = CanvasRenderingContext2D & { letterSpacing?: string };

type Walk = {
  ctx: Ctx;
  ox: number;
  oy: number;
  /** Only paint what lies within [0, maxY] page px (the rest is never shown on the screen). */
  maxY: number;
  range: Range;
  out: PaintedPage;
  caretEl: Element | null;
};

function paintText(node: Text, style: CSSStyleDeclaration, opacity: number, w: Walk) {
  const text = node.data;
  if (!text.trim()) return;
  const { ctx } = w;
  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
  ctx.fillStyle = style.color;
  ctx.globalAlpha = opacity;
  ctx.textBaseline = "alphabetic";
  const ascent = ctx.measureText("Hg").fontBoundingBoxAscent;
  const isCaret = w.caretEl !== null && node.parentElement === w.caretEl;
  let match: RegExpExecArray | null;
  WORD.lastIndex = 0;
  while ((match = WORD.exec(text))) {
    w.range.setStart(node, match.index);
    w.range.setEnd(node, match.index + match[0].length);
    const rect = w.range.getClientRects()[0];
    if (!rect || rect.width === 0) continue;
    const x = rect.left - w.ox;
    const top = rect.top - w.oy;
    if (top > w.maxY || top + rect.height < 0) continue;
    const y = top + ascent;
    ctx.fillText(transformText(match[0], style.textTransform), x, y);
    if (isCaret) w.out.caret = { x: rect.right - w.ox, y: top + rect.height / 2, height: rect.height };
  }
}

function paintElement(el: Element, inherited: number, w: Walk) {
  const style = getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return;
  const opacity = inherited * (Number.parseFloat(style.opacity) || 0);
  if (opacity < 0.03) return;
  const rect = el.getBoundingClientRect();
  const top = rect.top - w.oy;
  if (top > w.maxY || top + rect.height < 0) return;
  const { ctx } = w;
  if (rect.width > 0 && rect.height > 0) {
    if (alpha(style.backgroundColor) > 0) {
      ctx.globalAlpha = opacity;
      ctx.fillStyle = style.backgroundColor;
      ctx.fillRect(rect.left - w.ox, top, rect.width, rect.height);
    }
    const border = Number.parseFloat(style.borderTopWidth);
    if (border > 0 && style.borderTopStyle !== "none" && alpha(style.borderTopColor) > 0) {
      ctx.globalAlpha = opacity;
      ctx.fillStyle = style.borderTopColor;
      ctx.fillRect(rect.left - w.ox, top, rect.width, border);
    }
  }
  el.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) paintText(child as Text, style, opacity, w);
    else if (child.nodeType === Node.ELEMENT_NODE) paintElement(child as Element, opacity, w);
  });
}

/** Paints `root` (page px, origin at its top-left) into `ctx` with the current transform. */
export function paintPage(ctx: CanvasRenderingContext2D, root: HTMLElement, maxY: number): PaintedPage {
  const rect = root.getBoundingClientRect();
  const out: PaintedPage = { caret: null };
  const walk: Walk = {
    ctx: ctx as Ctx,
    ox: rect.left,
    oy: rect.top,
    maxY,
    range: document.createRange(),
    out,
    caretEl: root.querySelector("[data-zoom-caret]") ?? root.querySelector("h2"),
  };
  paintElement(root, 1, walk);
  ctx.globalAlpha = 1;
  return out;
}
