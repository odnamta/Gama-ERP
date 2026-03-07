'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CourseList } from '@/components/training/course-list';
import { TrainingCourse, TrainingType } from '@/types/training';
import { Plus, Search, BookOpen, Shield, Award, GraduationCap } from 'lucide-react';

const TRAINING_TYPES: { value: TrainingType | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua Jenis' },
  { value: 'induction', label: 'Induksi' },
  { value: 'refresher', label: 'Penyegaran' },
  { value: 'specialized', label: 'Khusus' },
  { value: 'certification', label: 'Sertifikasi' },
  { value: 'toolbox', label: 'Toolbox Talk' },
];

interface CoursesPageClientProps {
  initialCourses: TrainingCourse[];
  stats: {
    total: number;
    active: number;
    mandatory: number;
    certification: number;
  };
}

export function CoursesPageClient({ initialCourses, stats }: CoursesPageClientProps) {
  const [search, setSearch] = useState('');
  const [trainingType, setTrainingType] = useState<TrainingType | 'all'>('all');
  const [showInactive, setShowInactive] = useState(false);

  const filteredCourses = initialCourses.filter((course) => {
    if (!showInactive && !course.isActive) return false;
    if (trainingType !== 'all' && course.trainingType !== trainingType) return false;
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      course.courseCode.toLowerCase().includes(searchLower) ||
      course.courseName.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daftar Kursus Pelatihan</h1>
          <p className="text-muted-foreground">
            Kelola kursus pelatihan keselamatan kerja
          </p>
        </div>
        <Link href="/hse/training/courses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Kursus
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Kursus</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.mandatory}</p>
                <p className="text-xs text-muted-foreground">Wajib</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.certification}</p>
                <p className="text-xs text-muted-foreground">Sertifikasi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari kode atau nama kursus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={trainingType}
          onValueChange={(value) => setTrainingType(value as TrainingType | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRAINING_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={showInactive ? 'secondary' : 'outline'}
          onClick={() => setShowInactive(!showInactive)}
        >
          {showInactive ? 'Sembunyikan Nonaktif' : 'Tampilkan Nonaktif'}
        </Button>
      </div>

      <CourseList courses={filteredCourses} />
    </div>
  );
}
