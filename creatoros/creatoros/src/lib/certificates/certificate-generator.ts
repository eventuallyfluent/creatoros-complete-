import { prisma } from '@/lib/db/prisma'
import { getSiteSettings } from '@/lib/settings/site-settings'

interface CertificateData {
  studentName:   string
  courseTitle:   string
  instructorName: string
  completedAt:   Date
  siteName:      string
  primaryColor:  string
}

export function generateCertificateHtml(data: CertificateData): string {
  const dateStr = data.completedAt.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 297mm;
    height: 210mm;
    overflow: hidden;
    background: #0D0D1A;
    font-family: 'Cormorant Garamond', Georgia, serif;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cert {
    width: 100%;
    height: 100%;
    position: relative;
    background: linear-gradient(135deg, #0D0D1A 0%, #1A0A2E 50%, #0D0D1A 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 28mm 24mm;
    color: #F0EAF8;
    text-align: center;
  }

  /* Outer border */
  .cert::before {
    content: '';
    position: absolute;
    inset: 8mm;
    border: 1.5px solid rgba(192,132,252,0.35);
    pointer-events: none;
  }
  /* Inner border */
  .cert::after {
    content: '';
    position: absolute;
    inset: 11mm;
    border: 0.5px solid rgba(192,132,252,0.15);
    pointer-events: none;
  }

  /* Corner ornaments */
  .corner { position: absolute; font-size: 18px; color: rgba(192,132,252,0.5); line-height: 1; }
  .corner.tl { top: 14mm; left: 14mm; }
  .corner.tr { top: 14mm; right: 14mm; }
  .corner.bl { bottom: 14mm; left: 14mm; }
  .corner.br { bottom: 14mm; right: 14mm; }

  /* Radial glow */
  .glow {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 200mm; height: 120mm;
    background: radial-gradient(ellipse, rgba(123,47,190,0.12) 0%, transparent 70%);
    pointer-events: none;
  }

  .academy {
    font-family: 'Cinzel Decorative', serif;
    font-size: 9pt;
    letter-spacing: 0.25em;
    color: rgba(192,132,252,0.7);
    text-transform: uppercase;
    margin-bottom: 6mm;
  }

  .heading {
    font-family: 'Cinzel', serif;
    font-size: 11pt;
    font-weight: 600;
    letter-spacing: 0.2em;
    color: rgba(240,234,248,0.6);
    text-transform: uppercase;
    margin-bottom: 4mm;
  }

  .student-name {
    font-family: 'Cinzel Decorative', serif;
    font-size: 28pt;
    font-weight: 700;
    color: #F0EAF8;
    line-height: 1.2;
    margin-bottom: 5mm;
    background: linear-gradient(135deg, #F0EAF8, #C084FC, #F0EAF8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .sub {
    font-size: 11pt;
    color: rgba(240,234,248,0.55);
    letter-spacing: 0.08em;
    margin-bottom: 5mm;
  }

  .course-title {
    font-family: 'Cinzel', serif;
    font-size: 18pt;
    font-weight: 600;
    color: #E9D5FF;
    line-height: 1.3;
    margin-bottom: 8mm;
    max-width: 200mm;
  }

  .divider {
    width: 60mm;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(192,132,252,0.5), transparent);
    margin: 0 auto 8mm;
  }

  .meta {
    display: flex;
    gap: 30mm;
    align-items: flex-end;
    margin-top: 2mm;
  }

  .meta-block { text-align: center; }
  .meta-block .line { width: 50mm; height: 0.5px; background: rgba(192,132,252,0.3); margin-bottom: 3mm; }
  .meta-block .label { font-size: 7pt; letter-spacing: 0.15em; color: rgba(240,234,248,0.4); text-transform: uppercase; display: block; }
  .meta-block .value { font-family: 'Cinzel', serif; font-size: 9pt; color: rgba(240,234,248,0.7); }

  .seal {
    position: absolute;
    bottom: 18mm;
    right: 22mm;
    width: 22mm;
    height: 22mm;
    border: 1.5px solid rgba(192,132,252,0.4);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
  .seal::before {
    content: '';
    position: absolute;
    inset: 2px;
    border: 0.5px solid rgba(192,132,252,0.2);
    border-radius: 50%;
  }
</style>
</head>
<body>
<div class="cert">
  <div class="glow"></div>
  <span class="corner tl">✦</span>
  <span class="corner tr">✦</span>
  <span class="corner bl">✦</span>
  <span class="corner br">✦</span>

  <p class="academy">${data.siteName}</p>
  <p class="heading">Certificate of Completion</p>
  <p class="student-name">${escapeHtml(data.studentName)}</p>
  <p class="sub">has successfully completed</p>
  <p class="course-title">${escapeHtml(data.courseTitle)}</p>
  <div class="divider"></div>

  <div class="meta">
    <div class="meta-block">
      <div class="line"></div>
      <span class="label">Date of Completion</span>
      <span class="value">${dateStr}</span>
    </div>
    <div class="meta-block">
      <div class="line"></div>
      <span class="label">Instructor</span>
      <span class="value">${escapeHtml(data.instructorName)}</span>
    </div>
  </div>

  <div class="seal">✦</div>
</div>
</body>
</html>`
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function buildCertificateData(
  userId:   string,
  courseId: string,
): Promise<CertificateData | null> {
  const [enrollment, user, settings] = await Promise.all([
    prisma.enrollment.findUnique({
      where:   { userId_courseId: { userId, courseId } },
      include: {
        course: {
          include: { instructor: { select: { displayName: true } } },
        },
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
    getSiteSettings(),
  ])

  if (!enrollment?.completedAt) return null

  return {
    studentName:    user?.name || user?.email?.split('@')[0] || 'Student',
    courseTitle:    enrollment.course.title,
    instructorName: enrollment.course.instructor?.displayName ?? settings.siteName,
    completedAt:    enrollment.completedAt,
    siteName:       settings.siteName,
    primaryColor:   settings.primaryColor,
  }
}
