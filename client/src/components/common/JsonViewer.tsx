import { useState } from "react";
import { FiChevronDown, FiChevronRight, FiCopy, FiCheck, FiCode } from "react-icons/fi";

interface JsonViewerProps {
  data: any;
  title?: string;
  defaultExpanded?: boolean;
}

export const JsonViewer = ({ data, title = "Kết quả JSON", defaultExpanded = false }: JsonViewerProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy JSON:", error);
    }
  };

  const formatJson = (obj: any): string => {
    return JSON.stringify(obj, null, 2);
  };

  const highlightJson = (jsonString: string): string => {
    return jsonString
      .replace(/(".*?")\s*:/g, '<span class="json-key">$1</span>:')
      .replace(/:\s*(".*?")/g, ': <span class="json-string">$1</span>')
      .replace(/:\s*(\d+)/g, ': <span class="json-number">$1</span>')
      .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
      .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');
  };

  const getJsonSize = (obj: any): string => {
    const jsonString = JSON.stringify(obj);
    const bytes = new Blob([jsonString]).size;
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="json-viewer">
      <div className="json-viewer-header">
        <button
          className="json-viewer-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
          <FiCode />
          <span>{title}</span>
          <span className="json-size">({getJsonSize(data)})</span>
        </button>
        <button
          className="json-copy-button"
          onClick={handleCopy}
          title="Copy JSON to clipboard"
        >
          {copied ? <FiCheck className="text-green-500" /> : <FiCopy />}
        </button>
      </div>
      
      {isExpanded && (
        <div className="json-viewer-content">
          <pre className="json-code">
            <code dangerouslySetInnerHTML={{ __html: highlightJson(formatJson(data)) }} />
          </pre>
        </div>
      )}
    </div>
  );
};