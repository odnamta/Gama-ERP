'use client';

import { useState, useTransition } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Employee,
  Department,
  Position,
  EmployeeFormData,
} from '@/types/employees';
import {
  EMPLOYMENT_TYPES,
  GENDERS,
  MARITAL_STATUSES,
} from '@/lib/employee-utils';
import { createEmployee, updateEmployee } from '@/app/(main)/hr/employees/actions';

interface EmployeeFormProps {
  employee?: Employee;
  departments: Department[];
  positions: Position[];
  employees: { id: string; employee_code: string; full_name: string }[];
  canEditSalary?: boolean;
  nextCode?: string;
}

export function EmployeeForm({
  employee,
  departments,
  positions,
  employees,
  canEditSalary = false,
  nextCode,
}: EmployeeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  const [selectedDepartment, setSelectedDepartment] = useState(employee?.department_id || '');
  const [filteredPositions, setFilteredPositions] = useState(
    positions.filter(p => !selectedDepartment || p.department_id === selectedDepartment)
  );

  const isEditing = !!employee;

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    setFilteredPositions(
      value ? positions.filter(p => p.department_id === value) : positions
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: EmployeeFormData = {
      full_name: formData.get('full_name') as string,
      nickname: formData.get('nickname') as string || undefined,
      id_number: formData.get('id_number') as string || undefined,
      tax_id: formData.get('tax_id') as string || undefined,
      date_of_birth: formData.get('date_of_birth') as string || undefined,
      place_of_birth: formData.get('place_of_birth') as string || undefined,
      gender: (formData.get('gender') as string || undefined) as EmployeeFormData['gender'],
      religion: formData.get('religion') as string || undefined,
      marital_status: (formData.get('marital_status') as string || undefined) as EmployeeFormData['marital_status'],
      phone: formData.get('phone') as string || undefined,
      email: formData.get('email') as string || undefined,
      address: formData.get('address') as string || undefined,
      city: formData.get('city') as string || undefined,
      emergency_contact_name: formData.get('emergency_contact_name') as string || undefined,
      emergency_contact_phone: formData.get('emergency_contact_phone') as string || undefined,
      emergency_contact_relation: formData.get('emergency_contact_relation') as string || undefined,
      department_id: formData.get('department_id') as string || undefined,
      position_id: formData.get('position_id') as string || undefined,
      employment_type: (formData.get('employment_type') as string || 'permanent') as EmployeeFormData['employment_type'],
      join_date: formData.get('join_date') as string,
      end_date: formData.get('end_date') as string || undefined,
      reporting_to: formData.get('reporting_to') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    };

    // Add salary fields if user has permission
    if (canEditSalary) {
      const salaryStr = formData.get('base_salary') as string;
      data.base_salary = salaryStr ? parseFloat(salaryStr.replace(/[^0-9]/g, '')) : undefined;
      data.bank_name = formData.get('bank_name') as string || undefined;
      data.bank_account = formData.get('bank_account') as string || undefined;
      data.bank_account_name = formData.get('bank_account_name') as string || undefined;
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateEmployee(employee.id, data)
        : await createEmployee(data);

      if (result.success) {
        toast({
          title: isEditing ? 'Employee updated' : 'Employee created',
          description: isEditing
            ? 'Employee information has been updated.'
            : `Employee ${(result as { employee?: Employee }).employee?.employee_code} has been created.`,
        });
        router.push('/hr/employees');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Something went wrong',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Employee Code</Label>
              <Input
                value={employee?.employee_code || nextCode || 'Auto-generated'}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={employee?.full_name}
                required
              />
            </div>
          </div>


          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                name="nickname"
                defaultValue={employee?.nickname || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={employee?.email || ''}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="id_number">ID Number (KTP)</Label>
              <Input
                id="id_number"
                name="id_number"
                defaultValue={employee?.id_number || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_id">Tax ID (NPWP)</Label>
              <Input
                id="tax_id"
                name="tax_id"
                defaultValue={employee?.tax_id || ''}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                defaultValue={employee?.date_of_birth || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="place_of_birth">Place of Birth</Label>
              <Input
                id="place_of_birth"
                name="place_of_birth"
                defaultValue={employee?.place_of_birth || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select name="gender" defaultValue={employee?.gender || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="religion">Religion</Label>
              <Input
                id="religion"
                name="religion"
                defaultValue={employee?.religion || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marital_status">Marital Status</Label>
              <Select name="marital_status" defaultValue={employee?.marital_status || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {MARITAL_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={employee?.phone || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                defaultValue={employee?.city || ''}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              defaultValue={employee?.address || ''}
              rows={2}
            />
          </div>

          <Separator className="my-4" />
          <h4 className="text-sm font-medium">Emergency Contact</h4>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Contact Name</Label>
              <Input
                id="emergency_contact_name"
                name="emergency_contact_name"
                defaultValue={employee?.emergency_contact_name || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
              <Input
                id="emergency_contact_phone"
                name="emergency_contact_phone"
                defaultValue={employee?.emergency_contact_phone || ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_relation">Relation</Label>
              <Input
                id="emergency_contact_relation"
                name="emergency_contact_relation"
                defaultValue={employee?.emergency_contact_relation || ''}
              />
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Employment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Employment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="department_id">Department</Label>
              <Select
                name="department_id"
                defaultValue={employee?.department_id || ''}
                onValueChange={handleDepartmentChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.department_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="position_id">Position</Label>
              <Select name="position_id" defaultValue={employee?.position_id || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPositions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.position_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reporting_to">Reports To</Label>
              <Select name="reporting_to" defaultValue={employee?.reporting_to || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((e) => e.id !== employee?.id)
                    .map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.full_name} ({e.employee_code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employment_type">Employment Type</Label>
              <Select
                name="employment_type"
                defaultValue={employee?.employment_type || 'permanent'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="join_date">Join Date *</Label>
              <Input
                id="join_date"
                name="join_date"
                type="date"
                defaultValue={employee?.join_date || ''}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date (Contract)</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                defaultValue={employee?.end_date || ''}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compensation - Only shown if user has permission */}
      {canEditSalary && (
        <Card>
          <CardHeader>
            <CardTitle>Compensation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="base_salary">Base Salary (IDR)</Label>
              <Input
                id="base_salary"
                name="base_salary"
                type="text"
                defaultValue={employee?.base_salary?.toString() || ''}
                placeholder="0"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  name="bank_name"
                  defaultValue={employee?.bank_name || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_account">Account Number</Label>
                <Input
                  id="bank_account"
                  name="bank_account"
                  defaultValue={employee?.bank_account || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_account_name">Account Name</Label>
                <Input
                  id="bank_account_name"
                  name="bank_account_name"
                  defaultValue={employee?.bank_account_name || ''}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={employee?.notes || ''}
            rows={3}
            placeholder="Any additional notes about this employee..."
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : isEditing ? 'Update Employee' : 'Create Employee'}
        </Button>
      </div>
    </form>
  );
}
