import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { CourseForm } from '@/components/training/course-form';

export default async function NewCoursePage() {
  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(!!profile);
  if (explorerReadOnly) {
    const { redirect } = await import('next/navigation');
    redirect('/hse/training/courses');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tambah Kursus Baru</h1>
        <p className="text-muted-foreground">
          Buat kursus pelatihan keselamatan kerja baru
        </p>
      </div>

      <CourseForm />
    </div>
  );
}
