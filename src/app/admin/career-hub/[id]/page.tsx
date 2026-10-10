import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CareerHubPostForm from "@/components/career-hub/CareerHubPostForm";

export default async function EditCareerHubPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="space-y-6"><AdminPageHeader title="Edit artikel" description="Perbarui isi dan status publikasi." /><CareerHubPostForm postId={id} /></div>;
}
