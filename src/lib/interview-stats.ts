import { POSITION_QUESTIONS_EN } from "@/data/interview-questions-en";

/* ─── Hitung jumlah posisi & pertanyaan dari data nyata ─── */
export const INTERVIEW_POSITION_COUNT = POSITION_QUESTIONS_EN.length;
export const INTERVIEW_QUESTION_COUNT = POSITION_QUESTIONS_EN.reduce(
  (sum, p) => sum + (p.questions?.length ?? 0),
  0,
);