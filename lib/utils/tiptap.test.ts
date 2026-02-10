import { describe, it, expect } from "vitest";
import { validateTipTapNode, parseTipTapContent } from "./tiptap";

describe("TipTap Validation", () => {
  describe("validateTipTapNode", () => {
    it("should validate a simple paragraph", () => {
      const node = {
        type: "paragraph",
        content: [{ type: "text", text: "Hello world" }],
      };
      expect(validateTipTapNode(node)).toBe(true);
    });

    it("should validate headings with levels", () => {
      const node = {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "Title" }],
      };
      expect(validateTipTapNode(node)).toBe(true);
    });

    it("should fail on invalid heading level", () => {
      const node = {
        type: "heading",
        attrs: { level: 7 },
        content: [{ type: "text", text: "Too big" }],
      };
      expect(validateTipTapNode(node)).toBe(false);
    });

    it("should validate marks like bold and italic", () => {
      const node = {
        type: "text",
        text: "bold text",
        marks: [{ type: "bold" }],
      };
      expect(validateTipTapNode(node)).toBe(true);
    });

    it("should fail on unknown node types", () => {
      const node = {
        type: "script",
        content: [{ type: "text", text: "alert(1)" }],
      };
      expect(validateTipTapNode(node)).toBe(false);
    });

    it("should fail on unknown mark types", () => {
      const node = {
        type: "text",
        text: "evil",
        marks: [{ type: "blink" }],
      };
      expect(validateTipTapNode(node)).toBe(false);
    });
  });

  describe("parseTipTapContent", () => {
    it("should parse valid JSON", () => {
      const json = JSON.stringify({
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "hi" }] },
        ],
      });
      const result = parseTipTapContent(json);
      expect(result.valid).toBe(true);
      expect(result.content).toBeDefined();
    });

    it("should fail on non-doc root", () => {
      const json = JSON.stringify({ type: "paragraph" });
      const result = parseTipTapContent(json);
      expect(result.valid).toBe(false);
    });

    it("should fail on invalid JSON", () => {
      const result = parseTipTapContent("{ invalid }");
      expect(result.valid).toBe(false);
    });
  });
});
