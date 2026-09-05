import { ImageResponse } from 'next/og'
import { CHAIN_CONFIGS } from '@/lib/chainConfigs'

export const alt = 'Neon — 5 chains · live'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Static OG card generated at build time with Next ImageResponse. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#07070d',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Ambient glows */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(900px 600px at 10% -10%, rgba(139,124,248,0.28), transparent 60%), radial-gradient(800px 560px at 95% 0%, rgba(77,162,255,0.22), transparent 55%), radial-gradient(700px 500px at 50% 120%, rgba(153,69,255,0.18), transparent 60%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '1000px',
              height: '520px',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '40px',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '72px 84px',
            width: '100%',
            height: '100%',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg,#8b7cf8,#9945ff,#4da2ff)',
                fontSize: '30px',
                fontWeight: 900,
                color: '#fff',
              }}
            >
              N
            </div>
            <div
              style={{
                fontSize: '30px',
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              Neon
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                fontSize: '92px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.02,
                display: 'flex',
              }}
            >
              5 chains&nbsp;
              <span style={{ color: '#14f195' }}>· live</span>
            </div>
            <div style={{ fontSize: '30px', color: 'rgba(255,255,255,0.55)', display: 'flex' }}>
              Latest blocks · TPS · gas · latency — straight from public RPCs
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {CHAIN_CONFIGS.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 18px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '999px',
                    background: c.color,
                  }}
                />
                <div style={{ fontSize: '20px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                  {c.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
