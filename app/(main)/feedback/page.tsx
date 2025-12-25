import { Metadata } from 'next';
import { MyFeedbackList } from './my-feedback-list';

export const metadata: Metadata = {
  title: 'My Feedback | Gama ERP',
  description: 'View your submitted feedback and track status',
};

export default function MyFeedbackPage() {
  return <MyFeedbackList />;
}
