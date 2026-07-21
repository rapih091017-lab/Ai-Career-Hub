import { Metadata } from "next";
import { POSITION_QUESTIONS, QUESTION_CATEGORIES } from "@/data/interview-questions";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const position = POSITION_QUESTIONS.find((p) => p.id === id);

  if (!position) {
    return { title: "Posisi Tidak Ditemukan | AI Career Hub" };
  }

  const categoryName =
    QUESTION_CATEGORIES.find((c) => c.slug === position.categorySlug)?.name ||
    position.categorySlug;

  const questionCount = position.questions.length;
  const desc = `${questionCount} pertanyaan interview untuk posisi ${position.title} (${categoryName}). Lengkap dengan tips cara menjawab dan contoh jawaban terbaik untuk lolos seleksi.`;

  return {
    title: `${position.title} - Persiapan Interview`,
    description: desc,
    openGraph: {
      title: `${position.title} - Persiapan Interview | AI Career Hub`,
      description: desc,
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${position.title} - Persiapan Interview`,
      description: desc,
    },
    alternates: {
      canonical: `https://aicareerhub.com/interview/${id}`,
    },
  };
}

export default function InterviewDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
