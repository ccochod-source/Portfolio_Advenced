import type { ReactNode } from "react";

type MacBookProps = {
  /** Screen content, absolutely positioned inside a 16:10 frame. */
  children: ReactNode;
  /** Screen aspect ratio (width / height) when the content is not 16:10, e.g. a 16:9 capture shown uncropped. */
  aspect?: number;
  className?: string;
};

/** CSS laptop mock-up: silver aluminium lid and base, black bezel, 16:10 screen, no logo. Styles live in globals.css (`.macbook*`). */
export function MacBook({ children, aspect, className = "" }: MacBookProps) {
  return (
    <div className={`macbook ${className}`}>
      <div className="macbook-lid">
        <div className="macbook-bezel">
          <span aria-hidden className="macbook-camera" />
          <div className="macbook-screen" style={aspect ? { aspectRatio: aspect } : undefined}>{children}</div>
        </div>
      </div>
      <div className="macbook-base">
        <span aria-hidden className="macbook-notch" />
      </div>
      <div aria-hidden className="macbook-shadow" />
    </div>
  );
}
