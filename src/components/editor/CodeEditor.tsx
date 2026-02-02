import React, { useMemo } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-yaml';

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  language?: string;
  isMobile?: boolean;
}

// Detect language from content or file extension
const detectLanguage = (code: string): string => {
  if (code.includes('<!DOCTYPE html') || code.includes('<html')) return 'html';
  if (code.startsWith('{') || code.startsWith('[')) return 'json';
  if (code.includes('def ') || code.includes('import ') && code.includes(':')) return 'python';
  if (code.includes('interface ') || code.includes(': string') || code.includes(': number')) return 'typescript';
  if (code.includes('function ') || code.includes('const ') || code.includes('let ')) return 'javascript';
  if (code.includes('SELECT ') || code.includes('INSERT ') || code.includes('CREATE TABLE')) return 'sql';
  return 'markup';
};

const getGrammar = (lang: string) => {
  const grammars: Record<string, Prism.Grammar> = {
    html: Prism.languages.markup,
    markup: Prism.languages.markup,
    css: Prism.languages.css,
    javascript: Prism.languages.javascript,
    js: Prism.languages.javascript,
    typescript: Prism.languages.typescript,
    ts: Prism.languages.typescript,
    python: Prism.languages.python,
    py: Prism.languages.python,
    json: Prism.languages.json,
    bash: Prism.languages.bash,
    sh: Prism.languages.bash,
    sql: Prism.languages.sql,
    markdown: Prism.languages.markdown,
    md: Prism.languages.markdown,
    yaml: Prism.languages.yaml,
    yml: Prism.languages.yaml,
  };
  return grammars[lang] || Prism.languages.markup;
};

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, language, isMobile }) => {
  const detectedLang = useMemo(() => language || detectLanguage(value), [value, language]);
  
  const highlightCode = (code: string) => {
    const grammar = getGrammar(detectedLang);
    return Prism.highlight(code, grammar, detectedLang);
  };

  // Mobile gets larger font for readability
  const fontSize = isMobile ? 14 : 12;
  const lineHeight = isMobile ? '1.8' : '1.6';
  const padding = isMobile ? 16 : 12;

  return (
    <div className="h-full overflow-auto bg-background">
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={highlightCode}
        padding={padding}
        tabSize={2}
        insertSpaces={true}
        className="min-h-full text-foreground outline-none"
        style={{
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize,
          lineHeight,
        }}
        textareaClassName="focus:outline-none"
      />
    </div>
  );
};
