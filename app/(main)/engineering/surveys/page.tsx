import { getSurveys, getEmployees } from '@/lib/survey-actions';
import { SurveyList } from '@/components/surveys/survey-list';

export const dynamic = 'force-dynamic';

export default async function SurveysPage() {
  const [surveysResult, employeesResult] = await Promise.all([
    getSurveys(),
    getEmployees(),
  ]);

  const surveys = surveysResult.data || [];
  const employees = employeesResult.data || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Route Surveys</h1>
        <p className="text-muted-foreground">
          Manage route assessments for heavy-haul logistics
        </p>
      </div>

      <SurveyList surveys={surveys} surveyors={employees} />
    </div>
  );
}
