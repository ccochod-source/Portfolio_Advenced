import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Warm "golden hour" mark: sun over the horizon line, cream disc. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FFC145 0%, #FF7A1A 55%, #FF5A4E 100%)",
          position: "relative",
        }}
      >
        <div style={{ width: 74, height: 74, borderRadius: 999, background: "#FFF4E6", marginBottom: 36, display: "flex" }} />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 54,
            background: "#2B1A12",
            borderTopLeftRadius: "50% 100%",
            borderTopRightRadius: "50% 100%",
            display: "flex",
          }}
        />
      </div>
    ),
    size,
  );
}
