// Allowed TipTap node types from StarterKit
const ALLOWED_NODE_TYPES = new Set([
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "codeBlock",
  "hardBreak",
  "horizontalRule",
]);

// Allowed TipTap mark types from StarterKit
const ALLOWED_MARK_TYPES = new Set(["bold", "italic", "strike", "code"]);

/**
 * Recursively validates the structure of a TipTap JSON node.
 * This ensures the content is safe and follows expected patterns.
 */
export function validateTipTapNode(node: unknown): boolean {
  if (typeof node !== "object" || node === null) {
    return false;
  }

  const n = node as Record<string, unknown>;

  // Check node type
  if (typeof n.type !== "string" || !ALLOWED_NODE_TYPES.has(n.type)) {
    return false;
  }

  // Validate marks if present
  if (n.marks !== undefined) {
    if (!Array.isArray(n.marks)) return false;
    for (const mark of n.marks) {
      if (typeof mark !== "object" || mark === null) return false;
      const m = mark as Record<string, unknown>;
      if (typeof m.type !== "string" || !ALLOWED_MARK_TYPES.has(m.type)) {
        return false;
      }
    }
  }

  // Validate text content
  if (n.text !== undefined) {
    if (typeof n.text !== "string") return false;
  }

  // Validate attrs if present (only allow safe attributes)
  if (n.attrs !== undefined) {
    if (typeof n.attrs !== "object" || n.attrs === null) return false;
    const attrs = n.attrs as Record<string, unknown>;
    // Only allow level attribute for headings
    for (const key of Object.keys(attrs)) {
      if (key === "level") {
        if (
          typeof attrs.level !== "number" ||
          attrs.level < 1 ||
          attrs.level > 6
        ) {
          return false;
        }
      } else if (key === "language") {
        // Allow language for codeBlock
        if (typeof attrs.language !== "string" && attrs.language !== null) {
          return false;
        }
      } else {
        // Disallow unknown attributes
        return false;
      }
    }
  }

  // Recursively validate children
  if (n.content !== undefined) {
    if (!Array.isArray(n.content)) return false;
    for (const child of n.content) {
      if (!validateTipTapNode(child)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Parses and validates a TipTap JSON string.
 */
export function parseTipTapContent(jsonString: string): {
  valid: boolean;
  content: unknown;
} {
  try {
    const parsed = JSON.parse(jsonString);

    // Must be an object with type "doc"
    if (typeof parsed !== "object" || parsed === null) {
      return { valid: false, content: null };
    }

    if (parsed.type !== "doc") {
      return { valid: false, content: null };
    }

    if (!validateTipTapNode(parsed)) {
      return { valid: false, content: null };
    }

    return { valid: true, content: parsed };
  } catch {
    return { valid: false, content: null };
  }
}
