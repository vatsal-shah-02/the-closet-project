import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        background: '#4338ca',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          color: 'white',
          fontSize: 110,
          fontWeight: 700,
          fontFamily: 'sans-serif',
          lineHeight: 1,
          marginTop: 8,
        }}
      >
        C
      </div>
    </div>,
    { width: 180, height: 180 }
  )
}
