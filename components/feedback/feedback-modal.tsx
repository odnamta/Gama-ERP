'use client';

import { useState, useEffect } from 'react';
import { Bug, Lightbulb, HelpCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useToast } from '@/hooks/use-toast';
import { submitFeedback } from '@/app/actions/feedback';
import {
  captureBrowserContext,
  detectModuleFromUrl,
  validateFeedbackForm,
  getSeverityOptions,
  getPriorityOptions,
  getModuleOptions,
} from '@/lib/feedback-utils';
import type { FeedbackType, Severity, Priority, FeedbackFormData, ScreenshotData } from '@/types/feedback';
import { ScreenshotCapture } from './screenshot-capture';

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function FeedbackModal({ open, onOpenChange, onSuccess }: FeedbackModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedbackType>('bug');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity | undefined>();
  const [priority, setPriority] = useState<Priority | undefined>();
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [currentBehavior, setCurrentBehavior] = useState('');
  const [desiredBehavior, setDesiredBehavior] = useState('');
  const [businessJustification, setBusinessJustification] = useState('');
  const [affectedModule, setAffectedModule] = useState<string | undefined>();
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([]);
  
  // Auto-captured context
  const [pageUrl, setPageUrl] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [detectedModule, setDetectedModule] = useState('');

  // Capture context when modal opens
  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      setPageUrl(window.location.href);
      setPageTitle(document.title);
      setDetectedModule(detectModuleFromUrl(window.location.pathname));
    }
  }, [open]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSeverity(undefined);
    setPriority(undefined);
    setStepsToReproduce('');
    setExpectedBehavior('');
    setActualBehavior('');
    setCurrentBehavior('');
    setDesiredBehavior('');
    setBusinessJustification('');
    setAffectedModule(undefined);
    setScreenshots([]);
    setActiveTab('bug');
  };

  const handleSubmit = async () => {
    const formData: FeedbackFormData = {
      feedbackType: activeTab,
      title,
      description,
      severity: activeTab === 'bug' ? severity : undefined,
      prioritySuggested: priority,
      stepsToReproduce: activeTab === 'bug' ? stepsToReproduce : undefined,
      expectedBehavior: activeTab === 'bug' ? expectedBehavior : undefined,
      actualBehavior: activeTab === 'bug' ? actualBehavior : undefined,
      currentBehavior: activeTab === 'improvement' ? currentBehavior : undefined,
      desiredBehavior: activeTab === 'improvement' ? desiredBehavior : undefined,
      businessJustification: activeTab === 'improvement' ? businessJustification : undefined,
      affectedModule: affectedModule || detectedModule,
      screenshots,
    };

    // Validate
    const validation = validateFeedbackForm(formData);
    if (!validation.valid) {
      toast({
        title: 'Validation Error',
        description: validation.errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const browserInfo = captureBrowserContext();
      const result = await submitFeedback(formData, {
        pageUrl,
        pageTitle,
        module: affectedModule || detectedModule,
        browserInfo,
      });

      if (result.success && result.data) {
        toast({
          title: 'Feedback Submitted',
          description: `Your ticket ${result.data.ticketNumber} has been created.`,
        });
        resetForm();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to submit feedback',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Feedback</DialogTitle>
          <DialogDescription>
            Report a bug, suggest an improvement, or ask a question.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FeedbackType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bug" className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Bug Report
            </TabsTrigger>
            <TabsTrigger value="improvement" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Improvement
            </TabsTrigger>
            <TabsTrigger value="question" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Question
            </TabsTrigger>
          </TabsList>

          {/* Common Fields */}
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief summary of your feedback"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide more details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Bug Report Fields */}
          <TabsContent value="bug" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="severity">Severity *</Label>
                <Select value={severity} onValueChange={(v) => setSeverity(v as Severity)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSeverityOptions().map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="module">Affected Module</Label>
                <Select value={affectedModule || detectedModule} onValueChange={setAffectedModule}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    {getModuleOptions().map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="steps">Steps to Reproduce</Label>
              <Textarea
                id="steps"
                placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expected">Expected Behavior</Label>
                <Textarea
                  id="expected"
                  placeholder="What should happen?"
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actual">Actual Behavior</Label>
                <Textarea
                  id="actual"
                  placeholder="What actually happens?"
                  value={actualBehavior}
                  onChange={(e) => setActualBehavior(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </TabsContent>

          {/* Improvement Request Fields */}
          <TabsContent value="improvement" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {getPriorityOptions().map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imp-module">Affected Module</Label>
                <Select value={affectedModule || detectedModule} onValueChange={setAffectedModule}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    {getModuleOptions().map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current">Current Behavior</Label>
              <Textarea
                id="current"
                placeholder="How does it work now?"
                value={currentBehavior}
                onChange={(e) => setCurrentBehavior(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desired">Desired Behavior *</Label>
              <Textarea
                id="desired"
                placeholder="How would you like it to work?"
                value={desiredBehavior}
                onChange={(e) => setDesiredBehavior(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="justification">Business Justification</Label>
              <Textarea
                id="justification"
                placeholder="Why is this improvement important?"
                value={businessJustification}
                onChange={(e) => setBusinessJustification(e.target.value)}
                rows={2}
              />
            </div>
          </TabsContent>

          {/* Question Fields */}
          <TabsContent value="question" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="q-module">Related Module</Label>
              <Select value={affectedModule || detectedModule} onValueChange={setAffectedModule}>
                <SelectTrigger>
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  {getModuleOptions().map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Screenshots */}
          <div className="mt-4">
            <ScreenshotCapture
              screenshots={screenshots}
              onScreenshotsChange={setScreenshots}
              maxScreenshots={5}
              onModalClose={() => onOpenChange(false)}
              onModalOpen={() => onOpenChange(true)}
            />
          </div>

          {/* Context Info */}
          <div className="mt-4 p-3 bg-muted rounded-md text-sm text-muted-foreground">
            <p>Auto-captured context:</p>
            <ul className="mt-1 space-y-1">
              <li>Page: {pageTitle || 'Unknown'}</li>
              <li>Module: {detectedModule}</li>
              <li>URL: {pageUrl ? new URL(pageUrl).pathname : 'Unknown'}</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Feedback
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
