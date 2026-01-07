import React from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  onCursorChange?: (position: number) => void;
}

const highlightCode = (code: string) =>
  Prism.highlight(code, Prism.languages.markup, 'html');

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, onCursorChange }) => {
  const handleValueChange = (code: string) => {
    onChange(code);
  };

  return (
    <div className="flex-1 flex relative bg-elite-black overflow-auto">
      <Editor
        value={value}
        onValueChange={handleValueChange}
        highlight={highlightCode}
        padding={16}
        tabSize={2}
        insertSpaces={true}
        className="flex-1 bg-elite-black text-elite-text-bright outline-none resize-none focus:ring-0"
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 13,
          lineHeight: '1.7em',
          minHeight: '100%',
        }}
        textareaClassName="focus:outline-none"
      />
    </div>
  );
};
