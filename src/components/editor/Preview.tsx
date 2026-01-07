import React, { useMemo } from 'react';

interface PreviewProps {
  code: string;
}

export const Preview: React.FC<PreviewProps> = ({ code }) => {
  const srcDoc = useMemo(() => {
    return code;
  }, [code]);

  return (
    <div className="flex-1 bg-white overflow-hidden">
      <iframe
        title="preview"
        srcDoc={srcDoc}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups"
      />
    </div>
  );
};
