export interface TipTapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
}

// Converts TipTap / ProseMirror JSON document into semantic HTML
export function serializeTipTapToHtml(
  docJson: Record<string, unknown>,
): string {
  if (!docJson || typeof docJson !== "object") return "";

  const root = docJson as unknown as TipTapNode;
  if (!root.content || !Array.isArray(root.content)) return "";

  return root.content.map(renderNode).join("\n");
}

function renderNode(node: TipTapNode): string {
  if (!node) return "";

  const childrenHtml = node.content
    ? node.content.map(renderNode).join("")
    : "";
  const textContent = node.text ? escapeHtml(node.text) : "";

  switch (node.type) {
    case "heading": {
      const level = (node.attrs?.level as number) || 1;
      return `<h${level}>${childrenHtml || textContent}</h${level}>`;
    }
    case "paragraph":
      return `<p>${childrenHtml || textContent || "<br/>"}</p>`;
    case "bulletList":
      return `<ul>${childrenHtml}</ul>`;
    case "orderedList":
      return `<ol>${childrenHtml}</ol>`;
    case "listItem":
      return `<li>${childrenHtml || textContent}</li>`;
    case "blockquote":
      return `<blockquote>${childrenHtml || textContent}</blockquote>`;
    case "text":
      return textContent;
    default:
      return childrenHtml || textContent;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
