import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";

import "./RichContentViewer.scss";

interface ActiveImage {
  src: string;
  top: number;
  left: number;
}

interface Props {
  html: string;
  className?: string;
}

/**
 * Renders lesson/section rich-text HTML (from the Jodit editor) and lets
 * students tap an image to reveal a small download button next to it.
 * Content arrives as a raw HTML string (dangerouslySetInnerHTML), so
 * per-image click handling has to be done via event delegation on the
 * container rather than attaching handlers to individual React elements.
 */
export default function RichContentViewer({ html, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeImage, setActiveImage] = useState<ActiveImage | null>(null);

  useEffect(() => {
    if (!activeImage) return;

    const dismiss = () => setActiveImage(null);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);

    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [activeImage]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    if (target.tagName !== "IMG") {
      setActiveImage(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    setActiveImage({
      src: (target as HTMLImageElement).src,
      top: rect.top + 8,
      left: rect.left + 8,
    });
  };

  const handleDownload = async () => {
    if (!activeImage) return;

    try {
      const response = await fetch(activeImage.src);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const extensionMatch = activeImage.src.match(/\.(\w+)(?:\?|$)/);
      const extension = extensionMatch ? extensionMatch[1] : "jpg";

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `image.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Image download failed:", err);
    } finally {
      setActiveImage(null);
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`rich-content ${className}`}
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {activeImage && (
        <button
          type="button"
          className="rich-content-image-download"
          style={{ top: activeImage.top, left: activeImage.left }}
          onClick={handleDownload}
          aria-label="دانلود تصویر"
        >
          <Download size={16} />
        </button>
      )}
    </>
  );
}
