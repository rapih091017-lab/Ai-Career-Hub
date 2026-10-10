import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CareerHubPostForm from "@/components/career-hub/CareerHubPostForm";

export default function NewCareerHubPostPage() {
  return <div className="space-y-6"><AdminPageHeader title="Tulis artikel" description="Buat panduan baru untuk pembaca Career Hub." /><CareerHubPostForm /></div>;
}
