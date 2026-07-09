import { type NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const backendUrl = process.env.BACKEND_URL || 'http://172.20.10.5:8080'

  try {
    const response = await fetch(`${backendUrl}/api/test-results/${id}/video`, {
      method: 'POST',
      headers: {
        Authorization: request.headers.get('Authorization') || '',
        'Content-Type': request.headers.get('Content-Type') || 'video/mp4',
        'X-Filename': request.headers.get('X-Filename') || '',
      },
      body: request.body,
      // @ts-ignore
      duplex: 'half',
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (e) {
    console.error('[upload-video] error:', e)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
