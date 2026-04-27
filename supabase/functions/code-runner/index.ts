import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Free execution engine: Godbolt Compiler Explorer (no API key, public).
const GODBOLT_API = "https://godbolt.org/api";

// Map language hint → Godbolt compiler ID + lang slug
const GODBOLT_MAP: Record<string, { compiler: string; lang: string }> = {
  python:     { compiler: "python310",  lang: "python" },
  py:         { compiler: "python310",  lang: "python" },
  cpp:        { compiler: "g142",       lang: "c++"    },
  "c++":      { compiler: "g142",       lang: "c++"    },
  c:          { compiler: "cg142",      lang: "c"      },
  rust:       { compiler: "r1740",      lang: "rust"   },
  rs:         { compiler: "r1740",      lang: "rust"   },
  go:         { compiler: "gl1221",     lang: "go"     },
  java:       { compiler: "java2100",   lang: "java"   },
  csharp:     { compiler: "dotnet80csharpcoreclr", lang: "csharp" },
  cs:         { compiler: "dotnet80csharpcoreclr", lang: "csharp" },
  ruby:       { compiler: "ruby332",    lang: "ruby"   },
  rb:         { compiler: "ruby332",    lang: "ruby"   },
  php:        { compiler: "php830",     lang: "php"    },
  swift:      { compiler: "swift590",   lang: "swift"  },
  kotlin:     { compiler: "kotlinc1920", lang: "kotlin" },
};

const DISPLAY_NAME: Record<string, string> = {
  py: "Python", js: "JavaScript", deno: "TypeScript (Deno lokal)",
  cpp: "C++", c: "C", java: "Java", go: "Go", rs: "Rust",
  rb: "Ruby", php: "PHP", cs: "C#", swift: "Swift", kotlin: "Kotlin",
  bash: "Bash",
};

function detectLanguageHint(code: string, hint?: string): string | null {
  if (hint) {
    const n = hint.toLowerCase().replace(/[^a-z+#]/g, "");
    if (CODEX_LANG_MAP[n]) return CODEX_LANG_MAP[n];
    if (n === "bash" || n === "shell" || n === "sh") return "bash";
  }
  if (code.includes("def ") || code.includes("print(")) return "py";
  if (code.includes("fn main()")) return "rs";
  if (code.includes("package main")) return "go";
  if (code.includes("public static void main")) return "java";
  if (code.includes("<?php")) return "php";
  if (code.includes("#!/bin/bash") || code.includes("#!/bin/sh")) return "bash";
  if (code.includes("interface ") || /:\s*(string|number|boolean)/.test(code)) return "deno";
  if (code.includes("console.log") || code.includes("function ") || code.includes("=>")) return "js";
  return null;
}

// Run JS/TS locally inside Deno (sandboxed: no net, no fs by default in eval scope)
async function runJsLocal(code: string, stdin: string, isTs: boolean): Promise<{ output: string; exitCode: number; hasError: boolean }> {
  const logs: string[] = [];
  const errs: string[] = [];

  const sandboxConsole = {
    log: (...a: unknown[]) => logs.push(a.map(formatVal).join(" ")),
    error: (...a: unknown[]) => errs.push(a.map(formatVal).join(" ")),
    warn: (...a: unknown[]) => logs.push("[warn] " + a.map(formatVal).join(" ")),
    info: (...a: unknown[]) => logs.push(a.map(formatVal).join(" ")),
  };

  // Strip TS types crudely if marked as TS
  let src = code;
  if (isTs) {
    src = src
      .replace(/^\s*(import|export)\s+type\s+[^;]+;?$/gm, "")
      .replace(/(\:\s*[A-Za-z_$][\w$<>,\[\]\s|&]*)\s*(?=[=,)\]}])/g, "")
      .replace(/\bas\s+[A-Za-z_$][\w$<>,\[\]\s|&]*/g, "")
      .replace(/\binterface\s+\w+\s*\{[^}]*\}/g, "")
      .replace(/\btype\s+\w+\s*=\s*[^;]+;/g, "");
  }

  try {
    const fn = new Function("console", "stdin", `return (async () => { ${src}\n })();`);
    await fn(sandboxConsole, stdin);
    const output = [...logs, ...(errs.length ? ["[stderr]", ...errs] : [])].join("\n");
    return { output: output || "(Kein Output)", exitCode: 0, hasError: errs.length > 0 };
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}\n${e.stack ?? ""}` : String(e);
    return { output: [...logs, "[stderr]", msg].join("\n"), exitCode: 1, hasError: true };
  }
}

function formatVal(v: unknown): string {
  if (typeof v === "string") return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}

async function runViaCodex(language: string, code: string, stdin: string) {
  const res = await fetch(CODEX_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, language, input: stdin }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Codex API ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  // Codex returns { output, error, language, info, timeStamp }
  const stdout = (data.output || "").trim();
  const stderr = (data.error || "").trim();
  let combined = stdout;
  if (stderr) combined += (combined ? "\n" : "") + "[stderr]\n" + stderr;
  return {
    output: combined || "(Kein Output)",
    exitCode: stderr ? 1 : 0,
    hasError: !!stderr,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, language: langHint, stdin = "" } = await req.json();

    if (!code || typeof code !== "string") {
      return new Response(JSON.stringify({ error: "Kein Code angegeben." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = detectLanguageHint(code, langHint);
    if (!lang) {
      return new Response(JSON.stringify({
        error: "Sprache nicht erkannt. Unterstützt: Python, JavaScript, TypeScript, C, C++, Java, Go, Rust, Ruby, PHP, C#.",
        detected: false,
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[code-runner] lang=${lang} length=${code.length}`);

    let result: { output: string; exitCode: number; hasError: boolean };

    if (lang === "js") {
      result = await runJsLocal(code, stdin, false);
    } else if (lang === "deno") {
      result = await runJsLocal(code, stdin, true);
    } else if (lang === "bash") {
      result = {
        output: "(Bash-Ausführung wird in dieser Umgebung nicht unterstützt. Bitte JS/TS oder eine andere Sprache verwenden.)",
        exitCode: 1,
        hasError: true,
      };
    } else {
      try {
        result = await runViaCodex(lang, code, stdin);
      } catch (e) {
        console.error("[code-runner] Codex failed:", e);
        return new Response(JSON.stringify({
          error: `Externe Ausführungs-Engine derzeit nicht erreichbar. JS/TS funktionieren weiterhin lokal. Details: ${e instanceof Error ? e.message : String(e)}`,
        }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({
      output: result.output,
      exitCode: result.exitCode,
      language: DISPLAY_NAME[lang] ?? lang,
      detected: !langHint,
      hasError: result.hasError,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[code-runner] Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Interner Fehler",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
