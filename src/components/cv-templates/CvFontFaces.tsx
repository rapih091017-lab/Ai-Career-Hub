import { CV_FONT_FACE_CSS_PUBLIC } from "@/lib/cv-fonts";

/**
 * @font-face font CV untuk pratinjau. Berkas yang sama disematkan ke HTML PDF
 * di server, jadi glyph dan metrik di layar = di PDF.
 */
export function CvFontFaces() {
  return <style dangerouslySetInnerHTML={{ __html: CV_FONT_FACE_CSS_PUBLIC }} />;
}
