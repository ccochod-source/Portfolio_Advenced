import type { ComponentType, CSSProperties, HTMLAttributes, ReactNode, RefAttributes } from "react";

export type MotionTag =
  | "div"
  | "span"
  | "section"
  | "article"
  | "header"
  | "footer"
  | "aside"
  | "figure"
  | "blockquote"
  | "ul"
  | "ol"
  | "li"
  | "p"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6";

/** A `MotionTag` is cast to this so a single `HTMLElement` ref fits every tag. */
export type MotionElement = ComponentType<HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>>;

export type MotionBaseProps = {
  as?: MotionTag;
  id?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  "aria-label"?: string;
  [dataAttribute: `data-${string}`]: string | undefined;
};
