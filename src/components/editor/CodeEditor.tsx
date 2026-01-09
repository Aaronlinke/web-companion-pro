import React from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
}

const highlightCode = (code: string) =>
  Prism.highlight(code, Prism.languages.markup, 'html');

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange }) => {
  return (
    <div className="h-full overflow-auto bg-background">
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={highlightCode}
        padding={12}
        tabSize={2}
        insertSpaces={true}
        className="min-h-full text-foreground outline-none"
        style={{
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: 12,
          lineHeight: '1.6',
        }}
        textareaClassName="focus:outline-none"
      />
    </div>
  );
};