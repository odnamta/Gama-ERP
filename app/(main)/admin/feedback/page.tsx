import { Metadata } from 'next';
import { FeedbackDashboard } from './feedback-dashboard';

export const metadata: Metadata = {
  title: 'Feedback Management | Gama ERP',
  description: 'Manage bug reports and improvement requests',
};

export default function FeedbackPage() {
  return <FeedbackDashboard />;
}
