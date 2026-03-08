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

export const detectLanguage = (code: string): string => {
  const trimmed = code.trimStart();
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || /<\w+[\s>]/.test(trimmed)) return 'html';
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try { JSON.parse(trimmed); return 'json'; } catch { /* not JSON */ }
  }
  if (/^(def |class |import |from |#!\/usr\/bin\/python)/.test(trimmed)) return 'python';
  if (/(interface |type \w+ =|: string|: number|: boolean|<\w+>)/.test(trimmed)) return 'typescript';
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b/im.test(trimmed)) return 'sql';
  if (/^(#!\/bin\/bash|#!\/bin\/sh|\$ )/.test(trimmed) || /\becho\b.*&&/.test(trimmed)) return 'bash';
  if (/^(function |const |let |var |=>|require\(|module\.exports)/.test(trimmed)) return 'javascript';
  if (/^---\n|^\w+:\s*.+\n\w+:/.test(trimmed)) return 'yaml';
  if (/^(#\s|!\[)/.test(trimmed)) return 'markdown';
  return 'markup';
};

const LANG_LABELS: Record<string, string> = {
  html: 'HTML', markup: 'HTML', css: 'CSS', javascript: 'JS', js: 'JS',
  typescript: 'TS', ts: 'TS', python: 'PY', py: 'PY', json: 'JSON',
  bash: 'SH', sh: 'SH', sql: 'SQL', markdown: 'MD', md: 'MD',
  yaml: 'YAML', yml: 'YAML',
};

const getGrammar = (lang: string): Prism.Grammar => {
  const grammars: Record<string, Prism.Grammar> = {
    html: Prism.languages.markup,
    markup: Prism.languages.markup,
    css: Prism.languages.css,
    javascript: Prism.languages.javascript,
    js: Prism.languages.javascript,
    typescript: Prism.languages.typescript || Prism.languages.javascript,
    ts: Prism.languages.typescript || Prism.languages.javascript,
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
  const detectedLang = useMemo(() => language || detectLanguage(value), [language, value]);
  const lineCount = useMemo(() => value.split('\n').length, [value]);

  const highlightCode = (code: string) => {
    const grammar = getGrammar(detectedLang);
    return Prism.highlight(code, grammar, detectedLang);
  };

  const fontSize = isMobile ? 14 : 12;
  const lineHeight = isMobile ? 1.8 : 1.6;
  const padding = isMobile ? 16 : 12;
  const lineHeightPx = fontSize * lineHeight;

  // Build line numbers
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="h-full overflow-auto bg-background flex">
      {/* Line numbers gutter */}
      <div
        aria-hidden="true"
        className="shrink-0 select-none text-right bg-secondary/30 border-r border-border"
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize,
          lineHeight: `${lineHeightPx}px`,
          paddingTop: padding,
          paddingBottom: padding,
          paddingLeft: 8,
          paddingRight: 10,
          minWidth: lineCount >= 1000 ? 52 : lineCount >= 100 ? 44 : 36,
          color: 'hsl(var(--muted-foreground) / 0.4)',
        }}
      >
        {lineNumbers.map(n => (
          <div key={n} style={{ height: lineHeightPx }}>{n}</div>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto relative">
        {/* Language badge */}
        <div className="absolute top-2 right-3 z-10 pointer-events-none">
          <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/40 bg-background/80 px-1.5 py-0.5 rounded">
            {LANG_LABELS[detectedLang] || detectedLang.toUpperCase()}
          </span>
        </div>

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
    </div>
  );
};
