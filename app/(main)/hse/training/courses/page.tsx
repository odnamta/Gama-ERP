import { getCourses } from '@/lib/training-actions';
import { CoursesPageClient } from './courses-page-client';

export default async function CoursesPage() {
  const courses = await getCourses({});

  const stats = {
    total: courses.length,
    active: courses.filter(c => c.isActive).length,
    mandatory: courses.filter(c => c.isMandatory).length,
    certification: courses.filter(c => c.trainingType === 'certification').length,
  };

  return <CoursesPageClient initialCourses={courses} stats={stats} />;
}
