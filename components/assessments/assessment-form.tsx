'use client';

// components/assessments/assessment-form.tsx
// Assessment create/edit form for Technical Assessments module (v0.58)

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import {
  TechnicalAssessment,
  TechnicalAssessmentType,
  CreateAssessmentInput,
  UpdateAssessmentInput,
  CargoDimensions,
} from '@/types/assessment';
import { createAssessment, updateAssessment } from '@/lib/assessment-actions';
import { createClient } from '@/lib/supabase/client';

interface AssessmentFormProps {
  assessment?: TechnicalAssessment;
  assessmentTypes: TechnicalAssessmentType[];
}

interface Customer {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

interface Quotation {
  id: string;
  quotation_number: string;
}

export function AssessmentForm({ assessment, assessmentTypes }: AssessmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Related entities
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    assessment_type_id: assessment?.assessment_type_id || '',
    title: assessment?.title || '',
    description: assessment?.description || '',
    customer_id: assessment?.customer_id || '',
    project_id: assessment?.project_id || '',
    quotation_id: assessment?.quotation_id || '',
    cargo_description: assessment?.cargo_description || '',
    cargo_weight_tons: assessment?.cargo_weight_tons?.toString() || '',
    // Cargo dimensions
    length: assessment?.cargo_dimensions?.length?.toString() || '',
    width: assessment?.cargo_dimensions?.width?.toString() || '',
    height: assessment?.cargo_dimensions?.height?.toString() || '',
    cog_x: assessment?.cargo_dimensions?.cog_x?.toString() || '',
    cog_y: assessment?.cargo_dimensions?.cog_y?.toString() || '',
    cog_z: assessment?.cargo_dimensions?.cog_z?.toString() || '',
  });

  useEffect(() => {
    loadRelatedEntities();
  }, []);

  const loadRelatedEntities = async () => {
    const supabase = createClient();
    
    const [customersRes, projectsRes, quotationsRes] = await Promise.all([
      supabase.from('customers').select('id, name').order('name'),
      supabase.from('projects').select('id, name').order('name'),
      supabase.from('quotations').select('id, quotation_number').order('quotation_number', { ascending: false }),
    ]);

    if (customersRes.data) setCustomers(customersRes.data);
    if (projectsRes.data) setProjects(projectsRes.data);
    if (quotationsRes.data) setQuotations(quotationsRes.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Build cargo dimensions if any dimension is provided
      let cargoDimensions: CargoDimensions | undefined;
      if (formData.length || formData.width || formData.height) {
        cargoDimensions = {
          length: parseFloat(formData.length) || 0,
          width: parseFloat(formData.width) || 0,
          height: parseFloat(formData.height) || 0,
          cog_x: parseFloat(formData.cog_x) || 0,
          cog_y: parseFloat(formData.cog_y) || 0,
          cog_z: parseFloat(formData.cog_z) || 0,
        };
      }

      if (assessment) {
        // Update existing
        const input: UpdateAssessmentInput = {
          title: formData.title,
          description: formData.description || undefined,
          customer_id: formData.customer_id || undefined,
          project_id: formData.project_id || undefined,
          quotation_id: formData.quotation_id || undefined,
          cargo_description: formData.cargo_description || undefined,
          cargo_weight_tons: formData.cargo_weight_tons ? parseFloat(formData.cargo_weight_tons) : undefined,
          cargo_dimensions: cargoDimensions,
        };

        const result = await updateAssessment(assessment.id, input);
        if (!result.success) {
          setError(result.error || 'Failed to update assessment');
          return;
        }
        router.push(`/engineering/assessments/${assessment.id}`);
      } else {
        // Create new
        const input: CreateAssessmentInput = {
          assessment_type_id: formData.assessment_type_id,
          title: formData.title,
          description: formData.description || undefined,
          customer_id: formData.customer_id || undefined,
          project_id: formData.project_id || undefined,
          quotation_id: formData.quotation_id || undefined,
          cargo_description: formData.cargo_description || undefined,
          cargo_weight_tons: formData.cargo_weight_tons ? parseFloat(formData.cargo_weight_tons) : undefined,
          cargo_dimensions: cargoDimensions,
        };

        const result = await createAssessment(input);
        if (!result.success) {
          setError(result.error || 'Failed to create assessment');
          return;
        }
        router.push(`/engineering/assessments/${result.data?.id}`);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Enter the basic details for this technical assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assessment_type_id">Assessment Type *</Label>
              <Select
                value={formData.assessment_type_id}
                onValueChange={(value) => setFormData({ ...formData, assessment_type_id: value })}
                disabled={!!assessment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {assessmentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.type_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Assessment title"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the assessment"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Related Entities */}
      <Card>
        <CardHeader>
          <CardTitle>Related Entities</CardTitle>
          <CardDescription>
            Link this assessment to existing records (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_id">Customer</Label>
              <Select
                value={formData.customer_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, customer_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_id">Project</Label>
              <Select
                value={formData.project_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, project_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quotation_id">Quotation</Label>
              <Select
                value={formData.quotation_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, quotation_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select quotation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {quotations.map((quotation) => (
                    <SelectItem key={quotation.id} value={quotation.id}>
                      {quotation.quotation_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cargo Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Cargo Specifications</CardTitle>
          <CardDescription>
            Enter cargo details and dimensions (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cargo_description">Cargo Description</Label>
              <Textarea
                id="cargo_description"
                value={formData.cargo_description}
                onChange={(e) => setFormData({ ...formData, cargo_description: e.target.value })}
                placeholder="Describe the cargo"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo_weight_tons">Cargo Weight (tons)</Label>
              <Input
                id="cargo_weight_tons"
                type="number"
                step="0.01"
                min="0"
                value={formData.cargo_weight_tons}
                onChange={(e) => setFormData({ ...formData, cargo_weight_tons: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-medium">Dimensions (meters)</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="length" className="text-xs text-muted-foreground">Length</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.length}
                  onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width" className="text-xs text-muted-foreground">Width</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.width}
                  onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height" className="text-xs text-muted-foreground">Height</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Center of Gravity (meters from reference)</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="cog_x" className="text-xs text-muted-foreground">COG-X (from front)</Label>
                <Input
                  id="cog_x"
                  type="number"
                  step="0.01"
                  value={formData.cog_x}
                  onChange={(e) => setFormData({ ...formData, cog_x: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cog_y" className="text-xs text-muted-foreground">COG-Y (from left)</Label>
                <Input
                  id="cog_y"
                  type="number"
                  step="0.01"
                  value={formData.cog_y}
                  onChange={(e) => setFormData({ ...formData, cog_y: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cog_z" className="text-xs text-muted-foreground">COG-Z (from base)</Label>
                <Input
                  id="cog_z"
                  type="number"
                  step="0.01"
                  value={formData.cog_z}
                  onChange={(e) => setFormData({ ...formData, cog_z: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {assessment ? 'Update Assessment' : 'Create Assessment'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
