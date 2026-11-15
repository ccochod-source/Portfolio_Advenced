import type { ReactNode } from "react";

type SymbolSvgProps = { children: ReactNode; className?: string };

function SymbolSvg({ children, className }: SymbolSvgProps) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export function Enso({ className }: { className?: string }) {
  return (
    <SymbolSvg className={className}>
      <path
        fill="currentColor"
        d="M130 25
          C163 33 180 60 180 100
          C180 144 144 180 100 180
          C56 180 20 144 20 100
          C20 56 56 20 100 20
          C132 20 165 49 179 86
          C174 88 169 89 166 88
          C145 57 124 38 100 38
          C78 38 38 62 38 100
          C38 138 62 162 100 162
          C138 162 162 138 162 100
          C162 76 145 42 126 38
          C127 33 129 29 130 25Z"
      />
    </SymbolSvg>
  );
}

export function Lotus({ className }: { className?: string }) {
  return (
    <SymbolSvg className={className}>
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {[-64, -32, 0, 32, 64].map((angle) => (
          <path
            key={angle}
            d="M100 145C83 124 84 91 100 60c16 31 17 64 0 85Z"
            transform={`rotate(${angle} 100 145)`}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path d="M48 145c15 12 32 18 52 18s37-6 52-18M64 158c11 7 23 10 36 10s25-3 36-10" vectorEffect="non-scaling-stroke" />
        <path d="M100 142v24" vectorEffect="non-scaling-stroke" />
      </g>
    </SymbolSvg>
  );
}

export function Unalome({ className }: { className?: string }) {
  return (
    <SymbolSvg className={className}>
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M100 174c-18 0-21-17-8-23 13-6 23 5 17 14-5 8-17 5-16-3 1-5 8-7 11-2l-1-11-13-11 22-15-22-15 22-15-12-14 1-12"
          vectorEffect="non-scaling-stroke"
        />
        <path d="M100 67V55" vectorEffect="non-scaling-stroke" />
        <circle cx="100" cy="45" r="2.4" vectorEffect="non-scaling-stroke" />
        <circle cx="100" cy="31" r="2.4" vectorEffect="non-scaling-stroke" />
        <circle cx="100" cy="17" r="2.4" vectorEffect="non-scaling-stroke" />
      </g>
    </SymbolSvg>
  );
}

export function Mandala({ className }: { className?: string }) {
  return (
    <SymbolSvg className={className}>
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="100" cy="100" r="22" vectorEffect="non-scaling-stroke" />
        <circle cx="100" cy="100" r="43" vectorEffect="non-scaling-stroke" />
        <circle cx="100" cy="100" r="78" vectorEffect="non-scaling-stroke" />
        {Array.from({ length: 12 }, (_, index) => (
          <path
            key={index}
            d="M100 28c-13 13-13 29 0 38 13-9 13-25 0-38Z"
            transform={`rotate(${index * 30} 100 100)`}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path d="m100 57 8 35 35 8-35 8-8 35-8-35-35-8 35-8 8-35Z" vectorEffect="non-scaling-stroke" />
      </g>
    </SymbolSvg>
  );
}
