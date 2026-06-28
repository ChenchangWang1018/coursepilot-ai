import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

const katexOptions = {
  errorColor: "#334155",
  strict: "ignore",
  throwOnError: false,
};

type MarkdownContentProps = {
  content: string;
};

function splitProtectedMarkdown(content: string) {
  return content.split(/(```[\s\S]*?```|`[^`\n]*`)/g);
}

function splitDollarMath(content: string) {
  return content.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
}

function looksLikeMath(value: string) {
  const text = value.trim();

  if (!text) {
    return false;
  }

  return (
    /\\[a-zA-Z]+/.test(text) ||
    /[_^=<>]|\\/.test(text) ||
    /\b(?:frac|sqrt|sum|int|Delta|theta|alpha|beta|gamma|lambda|mu)\b/.test(text) ||
    /[A-Za-z]\s*[+\-*/=]\s*[A-Za-z0-9]/.test(text) ||
    /[A-Za-z0-9]\s*[+\-*/=]\s*[A-Za-z]/.test(text)
  );
}

function fixBrokenLeftRightDelimiters(content: string) {
  return content.replace(/\\left\s*\$([\s\S]*?)\\right\s*\$/g, (_match, math: string) =>
    `\\left(${math.trim()}\\right)`,
  );
}

function fixMalformedInlineMathTerminators(content: string) {
  return content
    .split(/((?:^|\n)[ \t]*\$\$[\s\S]*?\n[ \t]*\$\$(?=\n|$))/g)
    .map((part) => {
      if (part.trimStart().startsWith("$$")) {
        return part;
      }

      return part.replace(/\$([^$\n]+?)[$]{2,}(?=\s|[,:;.)\]]|$)/g, (_match, math: string) =>
        `$${math.trim()}$`,
      );
    })
    .join("");
}

function normalizeMalformedOneLineBlockMath(content: string) {
  return content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();

      if (!trimmed.startsWith("$$") || trimmed.endsWith("$$") || !trimmed.endsWith("$")) {
        return line;
      }

      const indent = line.match(/^\s*/)?.[0] ?? "";
      const math = trimmed.slice(2, -1).trim();

      if (!looksLikeMath(math)) {
        return line;
      }

      return `${indent}$$\n${indent}${math}\n${indent}$$`;
    })
    .join("\n");
}

function normalizeEscapedMathDelimiters(content: string) {
  return content
    .replace(/\\\[([\s\S]*?)\\\]/g, (_match, math: string) => `\n\n$$\n${math.trim()}\n$$\n\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_match, math: string) => `$${math.trim()}$`);
}

function normalizeBareBlockMath(content: string) {
  return content
    .replace(
      /(^|\n)[ \t]*\[[ \t]*\n([\s\S]*?)\n[ \t]*\][ \t]*(?=\n|$)/g,
      (match, prefix: string, math: string) =>
        looksLikeMath(math) ? `${prefix}\n$$\n${math.trim()}\n$$\n` : match,
    )
    .replace(
      /(^|\n)[ \t]*\[[ \t]*([^\]\n]+?)[ \t]*\][ \t]*(?=\n|$)/g,
      (match, prefix: string, math: string) =>
        looksLikeMath(math) ? `${prefix}\n$$\n${math.trim()}\n$$\n` : match,
    );
}

function normalizeBareInlineMath(content: string) {
  return content.replace(/\(([^()\n]+)\)/g, (match, math: string) =>
    looksLikeMath(math) ? `$${math.trim()}$` : match,
  );
}

function wrapStandaloneMathLines(content: string) {
  return content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();

      if (
        !trimmed ||
        trimmed.startsWith("$") ||
        trimmed.endsWith("$") ||
        /^#{1,6}\s/.test(trimmed) ||
        /^[-*+]\s/.test(trimmed) ||
        /^\d+\.\s/.test(trimmed) ||
        /^>\s/.test(trimmed)
      ) {
        return line;
      }

      if (
        looksLikeMath(trimmed) &&
        (/[=<>]/.test(trimmed) || /\\(?:sum|frac|int|sqrt|left|right|Delta|theta|alpha|beta|gamma)/.test(trimmed))
      ) {
        return `$$\n${trimmed}\n$$`;
      }

      return line;
    })
    .join("\n");
}

function normalizeTextSegment(content: string) {
  return splitDollarMath(content)
    .map((part) => {
      if (part.startsWith("$")) {
        return part;
      }

      return normalizeBareInlineMath(wrapStandaloneMathLines(normalizeBareBlockMath(part)));
    })
    .join("");
}

function normalizeMathDelimitersOutsideCode(content: string) {
  return splitProtectedMarkdown(content)
    .map((part) => {
      if (part.startsWith("`")) {
        return part;
      }

      return normalizeTextSegment(
        normalizeEscapedMathDelimiters(
          fixMalformedInlineMathTerminators(
            normalizeMalformedOneLineBlockMath(fixBrokenLeftRightDelimiters(part)),
          ),
        ),
      );
    })
    .join("");
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const normalizedContent = normalizeMathDelimitersOutsideCode(content);

  return (
    <div className="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[[rehypeKatex, katexOptions]]}>
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}

