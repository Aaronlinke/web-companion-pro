import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PISTON_API = "https://emkc.org/api/v2/piston";

// Language alias mapping → Piston language + version pattern
const LANGUAGE_MAP: Record<string, { language: string; version: string; fileName: string }> = {
  python:     { language: "python",     version: "3.10.0",  fileName: "main.py" },
  py:         { language: "python",     version: "3.10.0",  fileName: "main.py" },
  javascript: { language: "javascript", version: "18.15.0", fileName: "main.js" },
  js:         { language: "javascript", version: "18.15.0", fileName: "main.js" },
  typescript: { language: "typescript", version: "5.0.3",   fileName: "main.ts" },
  ts:         { language: "typescript", version: "5.0.3",   fileName: "main.ts" },
  bash:       { language: "bash",       version: "5.2.0",   fileName: "main.sh" },
  shell:      { language: "bash",       version: "5.2.0",   fileName: "main.sh" },
  sh:         { language: "bash",       version: "5.2.0",   fileName: "main.sh" },
  rust:       { language: "rust",       version: "1.68.2",  fileName: "main.rs" },
  go:         { language: "go",         version: "1.20.3",  fileName: "main.go" },
  c:          { language: "c",          version: "10.2.0",  fileName: "main.c" },
  cpp:        { language: "c++",        version: "10.2.0",  fileName: "main.cpp" },
  java:       { language: "java",       version: "15.0.2",  fileName: "Main.java" },
  ruby:       { language: "ruby",       version: "3.0.1",   fileName: "main.rb" },
  php:        { language: "php",        version: "8.2.3",   fileName: "main.php" },
  lua:        { language: "lua",        version: "5.4.4",   fileName: "main.lua" },
  r:          { language: "r",          version: "4.1.1",   fileName: "main.r" },
  kotlin:     { language: "kotlin",     version: "1.8.20",  fileName: "main.kt" },
  swift:      { language: "swift",      version: "5.8.1",   fileName: "main.swift" },
  csharp:     { language: "c#",         version: "6.12.0",  fileName: "main.cs" },
  cs:         { language: "c#",         version: "6.12.0",  fileName: "main.cs" },
};

function detectLanguage(code: string, hint?: string): { language: string; version: string; fileName: string } | null {
  if (hint) {
    const normalized = hint.toLowerCase().replace(/[^a-z+#]/g, '');
    if (LANGUAGE_MAP[normalized]) return LANGUAGE_MAP[normalized];
  }

  // Auto-detect from code patterns
  if (code.includes("def ") || code.includes("import ") && code.includes(":") || code.includes("print(")) {
    return LANGUAGE_MAP["python"];
  }
  if (code.includes("fn main()") && code.includes("let ")) return LANGUAGE_MAP["rust"];
  if (code.includes("func main()") || code.includes("package main")) return LANGUAGE_MAP["go"];
  if (code.includes("public static void main") || code.includes("System.out.println")) return LANGUAGE_MAP["java"];
  if (code.includes("<?php") || code.includes("echo ")) return LANGUAGE_MAP["php"];
  if (code.includes("#!/bin/bash") || code.includes("#!/bin/sh") || (code.includes("echo ") && !code.includes("console"))) {
    return LANGUAGE_MAP["bash"];
  }
  if (code.includes(": string") || code.includes(": number") || code.includes("interface ") || code.includes("const ") && code.includes(": ")) {
    return LANGUAGE_MAP["typescript"];
  }
  if (code.includes("console.log") || code.includes("const ") || code.includes("let ") || code.includes("function ")) {
    return LANGUAGE_MAP["javascript"];
  }

  return null;
}

// Fetch available runtimes once and cache
let cachedRuntimes: Array<{ language: string; version: string }> | null = null;

async function getRuntimes() {
  if (cachedRuntimes) return cachedRuntimes;
  try {
    const res = await fetch(`${PISTON_API}/runtimes`);
    if (res.ok) {
      cachedRuntimes = await res.json();
    }
  } catch {
    cachedRuntimes = [];
  }
  return cachedRuntimes || [];
}

async function findBestVersion(targetLang: string, preferredVersion: string): Promise<string> {
  const runtimes = await getRuntimes();
  const matches = runtimes.filter(r => r.language.toLowerCase() === targetLang.toLowerCase());
  if (matches.length === 0) return preferredVersion;

  // Prefer exact version, else use latest available
  const exact = matches.find(r => r.version === preferredVersion);
  if (exact) return exact.version;

  // Sort descending and pick latest
  matches.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
  return matches[0].version;
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

    const langDef = detectLanguage(code, langHint);

    if (!langDef) {
      return new Response(JSON.stringify({
        error: "Sprache konnte nicht erkannt werden. Unterstützte Sprachen: Python, JavaScript, TypeScript, Bash, Rust, Go, C, C++, Java, PHP, Ruby, Lua, R, Kotlin, Swift, C#",
        detected: false,
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get best matching version from Piston
    const bestVersion = await findBestVersion(langDef.language, langDef.version);

    console.log(`[code-runner] Executing ${langDef.language}@${bestVersion}, code length: ${code.length}`);

    const pistonPayload = {
      language: langDef.language,
      version: bestVersion,
      files: [{ name: langDef.fileName, content: code }],
      stdin: stdin || "",
      args: [],
      compile_timeout: 10000,
      run_timeout: 10000,
      compile_memory_limit: -1,
      run_memory_limit: -1,
    };

    const pistonRes = await fetch(`${PISTON_API}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pistonPayload),
    });

    if (!pistonRes.ok) {
      const errText = await pistonRes.text();
      console.error("[code-runner] Piston error:", pistonRes.status, errText);
      return new Response(JSON.stringify({
        error: `Ausführungs-Engine nicht verfügbar (${pistonRes.status}). Bitte später erneut versuchen.`,
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await pistonRes.json();

    const compile = result.compile || null;
    const run = result.run || {};

    const compileOutput = compile?.output?.trim() || "";
    const compileStderr = compile?.stderr?.trim() || "";
    const stdout = run.stdout?.trim() || "";
    const stderr = run.stderr?.trim() || "";
    const exitCode = run.code ?? 0;

    // Combine all outputs
    let output = "";
    if (compileStderr) output += `[Compile Error]\n${compileStderr}\n`;
    if (compileOutput) output += `[Compile Output]\n${compileOutput}\n`;
    if (stdout) output += stdout;
    if (stderr) output += `\n[stderr]\n${stderr}`;
    if (!output.trim() && exitCode === 0) output = "(Kein Output)";
    if (!output.trim() && exitCode !== 0) output = `(Prozess beendet mit Code ${exitCode})`;

    return new Response(JSON.stringify({
      output: output.trim(),
      exitCode,
      language: langDef.language,
      version: bestVersion,
      detected: !langHint,
      hasError: exitCode !== 0 || !!compileStderr,
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
