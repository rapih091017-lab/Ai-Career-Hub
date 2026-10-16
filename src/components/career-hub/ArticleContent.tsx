import { parseArticleBlocks, parseInline } from "@/lib/article-format";

/** Potongan teks dalam satu blok; yang tebal dibungkus <strong>. */
function inline(text: string, keyPrefix: string) {
  return parseInline(text).map((token, index) =>
    token.bold ? (
      <strong key={`${keyPrefix}-${index}`} className="font-bold text-on-background">
        {token.value}
      </strong>
    ) : (
      <span key={`${keyPrefix}-${index}`}>{token.value}</span>
    ),
  );
}

/**
 * Penampil isi artikel Career Hub.
 *
 * Memakai penanda format ringan dari `lib/article-format` (judul, tebal,
 * daftar, rata paragraf, kutipan). Isi artikel tetap teks biasa, jadi tidak
 * ada HTML yang perlu disanitasi saat ditampilkan.
 */
export default function ArticleContent({ content }: { content: string }) {
  const blocks = parseArticleBlocks(content);

  return (
    <div className="space-y-5 text-body-lg leading-8 text-on-surface">
      {blocks.map((block, index) => {
        const key = `block-${index}`;
        const alignClass =
          block.align === "center" ? "text-center" : block.align === "right" ? "text-right" : "";

        if (block.kind === "heading") {
          const Heading = block.level === 1 ? "h2" : block.level === 3 ? "h4" : "h3";
          return (
            <Heading
              key={key}
              className={`pt-4 font-headline-md text-headline-md text-on-background ${alignClass}`}
            >
              {block.text ? inline(block.text, key) : null}
            </Heading>
          );
        }

        if (block.kind === "quote") {
          return (
            <blockquote
              key={key}
              className={`border-l-4 border-primary/40 bg-surface-container-low px-5 py-4 text-on-surface-variant ${alignClass}`}
            >
              {block.text ? inline(block.text, key) : null}
            </blockquote>
          );
        }

        if (block.kind === "list" && block.items) {
          const ordered = block.items[0]?.kind === "ordered";
          const ListTag = ordered ? "ol" : "ul";
          return (
            <ListTag
              key={key}
              className={`space-y-2 pl-6 marker:text-primary ${ordered ? "list-decimal" : "list-disc"}`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>{inline(item.text, `${key}-${itemIndex}`)}</li>
              ))}
            </ListTag>
          );
        }

        return (
          <p key={key} className={`whitespace-pre-line ${alignClass}`}>
            {block.text ? inline(block.text, key) : null}
          </p>
        );
      })}
    </div>
  );
}