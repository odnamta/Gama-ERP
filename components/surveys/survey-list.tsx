'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RouteSurvey, SurveyStatus, SurveyFilters } from '@/types/survey';
import {
  filterSurveys,
  calculateStatusCounts,
  getSurveyStatusColor,
  getFeasibilityColor,
  SURVEY_STATUS_LABELS,
  FEASIBILITY_LABELS,
  formatDimensions,
  formatWeight,
  formatDistance,
} from '@/lib/survey-utils';
import { SurveyStatusCards } from './survey-status-cards';
import { Search, Plus, ChevronRight, MapPin, Package, User } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';

interface SurveyListProps {
  surveys: RouteSurvey[];
  surveyors: { id: string; full_name: string }[];
}

export function SurveyList({ surveys, surveyors }: SurveyListProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<SurveyFilters>({
    status: 'all',
    surveyorId: 'all',
    search: '',
  });

  const statusCounts = useMemo(() => calculateStatusCounts(surveys), [surveys]);
  const filteredSurveys = useMemo(() => filterSurveys(surveys, filters), [surveys, filters]);

  const handleStatusSelect = (status: SurveyStatus | 'all') => {
    setFilters((prev) => ({ ...prev, status }));
  };

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <SurveyStatusCards
        counts={statusCounts}
        selectedStatus={filters.status}
        onStatusSelect={handleStatusSelect}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value as SurveyStatus | 'all' }))}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="requested">Requested</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.surveyorId}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, surveyorId: value }))}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Surveyors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Surveyors</SelectItem>
            {surveyors.map((surveyor) => (
              <SelectItem key={surveyor.id} value={surveyor.id}>
                {surveyor.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search surveys..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="pl-9"
          />
        </div>

        <Button onClick={() => router.push('/engineering/surveys/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Survey
        </Button>
      </div>

      {/* Survey List */}
      <div className="space-y-4">
        {filteredSurveys.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No surveys found matching your criteria.
            </CardContent>
          </Card>
        ) : (
          filteredSurveys.map((survey) => (
            <SurveyCard
              key={survey.id}
              survey={survey}
              onClick={() => router.push(`/engineering/surveys/${survey.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface SurveyCardProps {
  survey: RouteSurvey;
  onClick: () => void;
}

function SurveyCard({ survey, onClick }: SurveyCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            {/* Header */}
            <div className="flex items-center gap-3">
              <span className="font-mono font-medium">{survey.surveyNumber}</span>
              <Badge className={getSurveyStatusColor(survey.status)}>
                {SURVEY_STATUS_LABELS[survey.status]}
              </Badge>
              {survey.status === 'completed' && survey.feasibility && (
                <Badge className={getFeasibilityColor(survey.feasibility)}>
                  {FEASIBILITY_LABELS[survey.feasibility]}
                </Badge>
              )}
            </div>

            {/* Cargo Description */}
            <p className="font-medium text-lg">{survey.cargoDescription}</p>

            {/* Route */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {survey.originLocation} → {survey.destinationLocation}
              </span>
              {survey.routeDistanceKm && (
                <span className="text-muted-foreground">
                  • {formatDistance(survey.routeDistanceKm)}
                </span>
              )}
            </div>

            {/* Cargo Dimensions */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>
                {formatDimensions(survey.cargoLengthM, survey.cargoWidthM, survey.cargoHeightM)}
                {survey.cargoWeightTons && ` • ${formatWeight(survey.cargoWeightTons)}`}
              </span>
            </div>

            {/* Surveyor */}
            {survey.surveyorName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>
                  {survey.surveyorName}
                  {survey.surveyDate && ` • ${formatDate(survey.surveyDate)}`}
                </span>
              </div>
            )}
          </div>

          <Button variant="ghost" size="icon">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
