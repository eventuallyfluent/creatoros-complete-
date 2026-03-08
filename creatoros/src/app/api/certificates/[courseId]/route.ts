import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { buildCertificateData, generateCertificateHtml } from '@/lib/certificates/certificate-generator'

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id

  const data = await buildCertificateData(userId, params.courseId)
  if (!data) {
    return NextResponse.json(
      { error: 'Course not completed or enrollment not found' },
      { status: 404 }
    )
  }

  const html = generateCertificateHtml(data)

  // Return HTML that renders as print-to-PDF page with auto-print dialog
  const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Certificate — ${data.courseTitle}</title>
  <style>
    @page { size: A4 landscape; margin: 0; }
    @media print { body { margin: 0; } .no-print { display: none; } }
    body { margin: 0; }
    .no-print {
      position: fixed; bottom: 20px; right: 20px; z-index: 999;
      background: #7B2FBE; color: white; border: none;
      padding: 12px 24px; border-radius: 8px;
      font-family: sans-serif; font-size: 15px; font-weight: 600;
      cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  ${html.replace('<!DOCTYPE html>', '').replace(/<html>[\s\S]*?<body>/, '').replace('</body></html>', '')}
  <button class="no-print" onclick="window.print()">⬇ Download / Print Certificate</button>
</body>
</html>`

  return new NextResponse(printHtml, {
    headers: {
      'Content-Type':        'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="certificate-${params.courseId}.html"`,
    },
  })
}
