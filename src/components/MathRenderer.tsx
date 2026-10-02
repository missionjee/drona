import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content?: string;
  latex?: string;
  className?: string;
  inline?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  latex,
  className = '',
  inline = false,
}) => {
  const textToRender = content || latex || '';

  const renderedContent = useMemo(() => {
    if (!textToRender) return '';

    // First process display math ($$ ... $$)
    const displayRegex = /\$\$([\s\S]*?)\$\$/g;
    let processed = textToRender.replace(displayRegex, (_, math) => {
      try {
        return `<div class="my-2 py-1 overflow-x-auto text-center">${katex.renderToString(math.trim(), {
          displayMode: true,
          throwOnError: false,
        })}</div>`;
      } catch (e) {
        return `<div class="my-2 text-amber-600 font-mono text-sm">[LaTeX Error: ${math}]</div>`;
      }
    });

    // Then process inline math ($ ... $)
    const inlineRegex = /\$([^\$\n]+?)\$/g;
    processed = processed.replace(inlineRegex, (_, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false,
        });
      } catch (e) {
        return `<span class="text-amber-600 font-mono text-xs">[LaTeX: ${math}]</span>`;
      }
    });

    return processed;
  }, [textToRender]);

  return (
    <div
      className={`math-content ${inline ? 'inline' : 'block'} ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};
