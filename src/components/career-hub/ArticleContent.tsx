export default function ArticleContent({ content }: { content: string }) {
  return (
    <div className="space-y-5 text-body-lg leading-8 text-on-surface">
      {content.split(/\n\s*\n/).map((paragraph, index) => {
        const text = paragraph.trim();
        if (!text) return null;
        if (text.startsWith("## ")) {
          return <h2 key={index} className="pt-4 font-headline-md text-headline-md text-on-background">{text.slice(3)}</h2>;
        }
        if (text.startsWith("# ")) {
          return <h2 key={index} className="pt-4 font-headline-md text-headline-md text-on-background">{text.slice(2)}</h2>;
        }
        return <p key={index} className="whitespace-pre-line">{text}</p>;
      })}
    </div>
  );
}
