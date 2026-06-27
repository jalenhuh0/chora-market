import { FeedbackForm } from "@/components/FeedbackForm";
import { APP_NAME } from "@/lib/market/defaults";

export const metadata = {
  title: `Feedback — ${APP_NAME}`,
};

export default function FeedbackPage() {
  return <FeedbackForm />;
}
