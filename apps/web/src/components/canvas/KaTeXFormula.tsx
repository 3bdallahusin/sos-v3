import React, { useMemo } from 'react';
import katex from 'katex';

interface KaTeXFormulaProps {
  formula: string;
  displayMode?: boolean;
  className?: string;
}

export const KaTeXFormula: React.FC<KaTeXFormulaProps> = ({
  formula,
  displayMode = false,
  className = ''
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(formula, {
        displayMode,
        throwOnError: false,
        strict: false
      });
    } catch (err) {
      console.error('KaTeX rendering error:', err);
      return formula;
    }
  }, [formula, displayMode]);

  return (
    <span
      className={`katex-rendered inline-block select-text ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
