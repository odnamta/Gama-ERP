'use client';

/**
 * Quick Links Component
 * v0.38: Help Center & Documentation
 */

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Rocket, Target, Keyboard } from 'lucide-react';

interface QuickLink {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const quickLinks: QuickLink[] = [
  {
    title: 'Getting Started',
    description: 'New to GAMA ERP? Start here',
    href: '/help/articles/getting-started',
    icon: <Rocket className="h-6 w-6" />,
  },
  {
    title: 'Guided Tours',
    description: 'Interactive guides for key workflows',
    href: '/training',
    icon: <Target className="h-6 w-6" />,
  },
  {
    title: 'Keyboard Shortcuts',
    description: 'Work faster with shortcuts',
    href: '/help/shortcuts',
    icon: <Keyboard className="h-6 w-6" />,
  },
];

export function QuickLinks() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {quickLinks.map((link) => (
        <Link key={link.href} href={link.href}>
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="text-primary">{link.icon}</div>
              <div>
                <h3 className="font-medium text-sm">{link.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {link.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
