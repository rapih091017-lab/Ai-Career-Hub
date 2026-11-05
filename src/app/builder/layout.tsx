import { CvFontFaces } from "@/components/cv-templates/CvFontFaces";

/** @font-face font CV hanya di halaman yang merender pratinjau/thumbnail CV. */
export default function CvFontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CvFontFaces />
      {children}
    </>
  );
}
