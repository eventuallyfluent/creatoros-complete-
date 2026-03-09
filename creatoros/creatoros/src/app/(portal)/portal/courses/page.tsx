export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'

// /portal/courses redirects to /portal (the library IS the courses list)
export default function PortalCoursesRedirect() {
  redirect('/portal')
}
