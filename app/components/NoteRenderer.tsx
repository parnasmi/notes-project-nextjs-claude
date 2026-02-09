import { ReactNode } from "react";

type TipTapMark = {
  type: "bold" | "italic" | "strike" | "code";
};

type TipTapNode = {
  type: string;
  content?: TipTapNode[];
  text?: string;
  marks?: TipTapMark[];
  attrs?: {
    level?: number;
    language?: string | null;
  };
};

function renderMarks(text: string, marks?: TipTapMark[]): ReactNode {
  if (!marks || marks.length === 0) return text;

  return marks.reduce<ReactNode>((acc, mark) => {
    switch (mark.type) {
      case "bold":
        return <strong>{acc}</strong>;
      case "italic":
        return <em>{acc}</em>;
      case "strike":
        return <s>{acc}</s>;
      case "code":
        return <code className="bg-gray-100 px-1 rounded text-sm">{acc}</code>;
      default:
        return acc;
    }
  }, text);
}

function renderNode(node: TipTapNode, index: number): ReactNode {
  const key = index;

  switch (node.type) {
    case "doc":
      return (
        <div key={key} className="prose prose-gray max-w-none">
          {node.content?.map((child, i) => renderNode(child, i))}
        </div>
      );

    case "paragraph":
      return (
        <p key={key}>
          {node.content?.map((child, i) => renderNode(child, i)) ?? "\u00A0"}
        </p>
      );

    case "heading": {
      const level = node.attrs?.level ?? 1;
      const children = node.content?.map((child, i) => renderNode(child, i));
      switch (level) {
        case 1:
          return <h1 key={key}>{children}</h1>;
        case 2:
          return <h2 key={key}>{children}</h2>;
        case 3:
          return <h3 key={key}>{children}</h3>;
        case 4:
          return <h4 key={key}>{children}</h4>;
        case 5:
          return <h5 key={key}>{children}</h5>;
        case 6:
          return <h6 key={key}>{children}</h6>;
        default:
          return <h1 key={key}>{children}</h1>;
      }
    }

    case "bulletList":
      return (
        <ul key={key}>
          {node.content?.map((child, i) => renderNode(child, i))}
        </ul>
      );

    case "orderedList":
      return (
        <ol key={key}>
          {node.content?.map((child, i) => renderNode(child, i))}
        </ol>
      );

    case "listItem":
      return (
        <li key={key}>
          {node.content?.map((child, i) => renderNode(child, i))}
        </li>
      );

    case "blockquote":
      return (
        <blockquote key={key}>
          {node.content?.map((child, i) => renderNode(child, i))}
        </blockquote>
      );

    case "codeBlock":
      return (
        <pre key={key} className="bg-gray-100 p-4 rounded overflow-x-auto">
          <code>
            {node.content?.map((child, i) => renderNode(child, i))}
          </code>
        </pre>
      );

    case "hardBreak":
      return <br key={key} />;

    case "horizontalRule":
      return <hr key={key} />;

    case "text":
      return (
        <span key={key}>{renderMarks(node.text ?? "", node.marks)}</span>
      );

    default:
      return null;
  }
}

type NoteRendererProps = {
  contentJson: string;
};

export function NoteRenderer({ contentJson }: NoteRendererProps) {
  try {
    const doc = JSON.parse(contentJson) as TipTapNode;
    return renderNode(doc, 0);
  } catch {
    return <p className="text-gray-500">Unable to render note content.</p>;
  }
}
