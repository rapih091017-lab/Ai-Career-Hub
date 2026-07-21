"use client";

interface AtsScoreInsightProps {
  score: number;
}

export function AtsScoreInsight({ score }: AtsScoreInsightProps) {
  return (
    <div className="w-[80%] my-8">
      <div
        className={`rounded-2xl p-4 backdrop-blur-md flex items-start gap-4 border ${
          score >= 70
            ? "bg-green-50 border-green-200"
            : score >= 40
              ? "bg-amber-50 border-amber-200"
              : "bg-red-50 border-red-200"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            score >= 70
              ? "bg-green-100"
              : score >= 40
                ? "bg-amber-100"
                : "bg-red-100"
          }`}
        >
          <span
            className={`material-symbols-outlined ${
              score >= 70 ? "text-green-700" : score >= 40 ? "text-amber-700" : "text-red-700"
            }`}
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            {score >= 70 ? "check_circle" : score >= 40 ? "trending_up" : "warning"}
          </span>
        </div>
        <div>
          <h5 className="text-sm font-label-bold text-on-surface mb-0.5">
            ATS Score: {score}%
            {" — "}
            {score >= 70
              ? "CV Siap Lamar!"
              : score >= 40
                ? "Perlu Optimalisasi"
                : "Butuh Perbaikan Besar"}
          </h5>
          <p className="text-xs text-on-surface-variant">
            {score < 40
              ? "Tambahkan kata kunci dari deskripsi pekerjaan ke dalam pengalaman dan skill kamu."
              : score < 70
                ? "Beberapa kata kunci masih kurang. Gunakan fitur Saran AI atau Optimalkan di tiap deskripsi pekerjaan."
                : "CV kamu sudah sangat cocok dengan deskripsi pekerjaan. Siap dilanjutkan ke tahap melamar!"}
          </p>
        </div>
      </div>
    </div>
  );
}
