import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 110,
          fontWeight: 700,
          letterSpacing: '-0.05em',
          fontFamily: 'system-ui',
        }}
      >
        c
      </div>
    ),
    size,
  );
}
