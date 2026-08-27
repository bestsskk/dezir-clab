import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '7px',
          background: 'linear-gradient(135deg, #1e1e24 0%, #0c0c0e 100%)',
          border: '1.5px solid rgba(244, 63, 94, 0.7)',
        }}
      >
        <span
          style={{
            fontSize: 21,
            fontWeight: 900,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#f43f5e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          D
        </span>
      </div>
    ),
    {
      ...size,
    }
  );
}
