import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 512,
        height: 512,
        background: '#4338ca',
        borderRadius: 115,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          color: 'white',
          fontSize: 300,
          fontWeight: 700,
          fontFamily: 'sans-serif',
          lineHeight: 1,
          marginTop: 20,
        }}
      >
        C
      </div>
    </div>,
    { width: 512, height: 512 }
  )
}
