'use client';

/**
 * FAQ Accordion Component
 * v0.38: Help Center & Documentation
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpFAQ, HelpArticleCategory } from '@/types/help-center';
import { groupFAQsByCategory, getCategoryDisplayInfo } from '@/lib/help-center-utils';

interface FAQAccordionProps {
  faqs: HelpFAQ[];
  showCategories?: boolean;
  defaultExpanded?: string[];
}

export function FAQAccordion({ 
  faqs, 
  showCategories = false,
  defaultExpanded = []
}: FAQAccordionProps) {
  if (showCategories) {
    const groupedFAQs = groupFAQsByCategory(faqs);
    const categoriesWithFAQs = Object.entries(groupedFAQs)
      .filter(([, items]) => items.length > 0) as [HelpArticleCategory, HelpFAQ[]][];

    return (
      <div className="space-y-6">
        {categoriesWithFAQs.map(([category, categoryFaqs]) => {
          const { label, icon } = getCategoryDisplayInfo(category);
          return (
            <div key={category}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <span>{icon}</span>
                {label}
              </h3>
              <Accordion type="multiple" defaultValue={defaultExpanded}>
                {categoryFaqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left text-sm">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Accordion type="multiple" defaultValue={defaultExpanded}>
      {faqs.map((faq) => (
        <AccordionItem key={faq.id} value={faq.id}>
          <AccordionTrigger className="text-left text-sm">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
