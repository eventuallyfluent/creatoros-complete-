import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import CourseEditor from '@/components/admin/CourseEditor'
import CurriculumBuilder from '@/components/admin/CurriculumBuilder'
import Link from 'next/link'

interface Props { params: { courseId: string } }

export const metadata: Metadata = { title: 'Edit Course — Admin' }

export default async function EditCoursePage({ params }: Props) {
  const [course, instructors] = await Promise.all([
    prisma.course.findUnique({
      where:   { id: params.courseId },
      include: {
        modules: {
          include: { lessons: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
        instructor: true,
      },
    }),
    prisma.instructorProfile.findMany({
      select:  { id: true, displayName: true },
      orderBy: { displayName: 'asc' },
    }),
  ])

  if (!course) notFound()

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title={course.title}
        description={`/courses/${course.slug}`}
        backHref="/admin/courses"
        backLabel="All Courses"
        action={{ label: 'View Public Page', href: `/courses/${course.slug}` }}
      />

      {/* Tab-like sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* Section 1: Course details */}
        <section>
          <SectionHeading>Course Details</SectionHeading>
          <CourseEditor course={course as any} instructors={instructors} />
        </section>

        {/* Section 2: Curriculum builder */}
        <section>
          <SectionHeading>Curriculum</SectionHeading>
          <CurriculumBuilder courseId={course.id} modules={course.modules as any} />
        </section>

        {/* Section 3: Sales page */}
        <section>
          <SectionHeading>Sales Page</SectionHeading>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>Customise your sales page</p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                Edit the sections, layout, and content that visitors see before purchasing. Add outcomes, testimonials, FAQ, instructor bio, and more — all optional and reorderable.
              </p>
            </div>
            <Link href={`/admin/courses/${course.id}/sales-page`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#7B2FBE', color: 'white', borderRadius: '8px', fontWeight: 600, fontSize: '14px', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Edit Sales Page →
            </Link>
          </div>
        </section>

      </div>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: '16px', fontWeight: 700, color: '#111827',
      marginBottom: '16px', paddingBottom: '12px',
      borderBottom: '1px solid #e5e7eb',
    }}>
      {children}
    </h2>
  )
}
