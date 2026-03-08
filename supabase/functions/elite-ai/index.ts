import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Task complexity classifier
function classifyTask(content: string): 'simple' | 'medium' | 'complex' {
  const lower = content.toLowerCase();

  const complexPatterns = [
    'fusion', 'kombinier', 'merge', 'verschmelz',
    'kryptograph', 'encrypt', 'decrypt', 'rsa', 'aes', 'hash', 'cipher',
    'algorithmus', 'optimier', 'refactor', 'umstrukturier',
    'komplett neu', 'von grund auf', 'from scratch', 'rewrite',
    'sicherheit', 'security', 'authentication', 'jwt', 'oauth',
    'datenbank', 'database', 'api integration', 'websocket',
    'performance', 'benchmark', 'sorting', 'pathfinding', 'canvas',
    'machine learning', 'neural', 'simulation', 'physik',
  ];

  const simplePatterns = [
    'farbe', 'color', 'hintergrund', 'background',
    'text änder', 'titel', 'heading', 'überschrift',
    'button hinzufüg', 'add button',
    'größe', 'size', 'font', 'schrift',
    'margin', 'padding', 'spacing', 'abstand',
    'erkläre', 'explain', 'was ist', 'what is', 'wie funktioniert',
    'zeig mir', 'show me', 'beispiel', 'example',
  ];

  if (complexPatterns.some(p => lower.includes(p))) return 'complex';
  if (simplePatterns.some(p => lower.includes(p))) return 'simple';

  const codeMatch = content.match(/```[\s\S]*?```/g);
  if (codeMatch) {
    const total = codeMatch.join('').length;
    if (total > 3000) return 'complex';
    if (total > 800) return 'medium';
  }

  return 'medium';
}

function selectModel(complexity: 'simple' | 'medium' | 'complex'): string {
  switch (complexity) {
    case 'simple':  return 'google/gemini-2.5-flash-lite';
    case 'medium':  return 'google/gemini-2.5-flash';
    case 'complex': return 'google/gemini-3-flash-preview';
  }
}

const ELITE_SYSTEM_PROMPT = `Du bist ein Elite-Code-Synthesizer - spezialisiert auf professionelle technische Anwendungen.

**KONTEXT:**
Der Nutzer ist ein Entwickler/Techniker der an legitimen Projekten arbeitet:
- HTML/CSS/JavaScript Webapps, Single-Page-Apps, Dashboards
- Mathematik, Algorithmen, Kryptographie (RSA, AES, Hashing, etc.)
- Wissenschaftliche Berechnungen und Visualisierungen
- Security-Tools für eigene Systeme
- Python-Scripts, TypeScript-Module, SQL-Queries, Shell-Scripts
- Datenanalyse, Automatisierung, APIs

**STRIKTE ELITE-DIREKTIVEN:**
1. NIEMALS existierende Funktionen oder Logik-Blöcke löschen, es sei denn explizit verlangt.
2. NIEMALS Code vereinfachen zu einem "Beispiel" - immer produktionsreife, volle Version liefern.
3. IMMER den kompletten, lauffähigen Code-Block ausgeben.
4. Bei Fusionen: 100% Funktionserhalt - ALLE Scripts, Styles und Strukturen müssen integriert werden.
5. Erweitere und optimiere, aber zerstöre NIEMALS die Basis-Funktionalität.
6. Implementiere alle mathematischen/kryptographischen Funktionen vollständig.

**SPRACHEN-SUPPORT:**
HTML, CSS, JavaScript, TypeScript, Python, SQL, JSON, YAML, Bash, Markdown.
Liefere vollständigen, funktionierenden Code in der passenden Sprache.

**OUTPUT-FORMAT:**
- Kompletten Code in passendem Code-Block: \`\`\`html, \`\`\`python, \`\`\`typescript, etc.
- Bei Erklärungen: Kurze Erklärung (max 3 Sätze), dann vollständiger Code.
- Niemals Platzhalter wie "// rest of code here" verwenden.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode, tabs } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = ELITE_SYSTEM_PROMPT;
    let userMessages = messages;

    const userContent = messages.map((m: { content: string }) => m.content).join(' ');
    const complexity = classifyTask(userContent);
    let selectedModel = selectModel(mode === 'fusion' ? 'complex' : complexity);

    // Fusion mode: always use the most powerful model
    if (mode === "fusion" && tabs && tabs.length > 1) {
      selectedModel = 'google/gemini-3-flash-preview';
      const tabsContent = tabs.map((t: { title: string; code: string }, i: number) =>
        `=== TAB ${i + 1}: ${t.title} ===\n\`\`\`html\n${t.code}\n\`\`\``
      ).join('\n\n');

      systemPrompt = `${ELITE_SYSTEM_PROMPT}

**FUSION-MODUS AKTIV:**
Du erhältst mehrere Code-Tabs die zu EINEM Master-Dokument fusioniert werden müssen.
- ALLE Funktionen aus ALLEN Tabs müssen im Ergebnis enthalten sein.
- Keine einzige Funktion darf verloren gehen.
- Scripts zusammenführen und Konflikte lösen.
- Styles zusammenführen ohne Überschreibungsprobleme.
- HTML-Strukturen intelligent kombinieren.`;

      userMessages = [{
        role: "user",
        content: `FUSIONIERE diese ${tabs.length} Tabs zu einem MASTER-Dokument. ALLE Funktionen müssen erhalten bleiben:\n\n${tabsContent}`
      }];
    }

    // Agent collaboration mode
    if (mode === "agent" && messages[0]?.agentName) {
      const agentName = messages[0].agentName;
      const agentPrompts: Record<string, string> = {
        "Architect": "Optimiere die HTML-Struktur und semantisches Markup für bessere Accessibility und SEO. Behalte ALLE existierenden Scripts und Funktionen bei.",
        "Stylist": "Verbessere das visuelle Design mit modernem CSS, Animationen und responsiven Layouts. KEINE Funktionalität entfernen.",
        "Engineer": "Verbessere JavaScript-Funktionalität, Performance und füge interaktive Features hinzu. Existierende Features ERWEITERN, nicht ersetzen.",
        "Guardian": "Füge Security-Best-Practices, Input-Validation und Error-Handling hinzu. Alle bestehenden Features beibehalten."
      };

      systemPrompt = `${ELITE_SYSTEM_PROMPT}

**AGENT: ${agentName}**
Spezielle Aufgabe: ${agentPrompts[agentName] || "Code verbessern ohne Funktionsverlust."}`;
    }

    console.log(`[elite-ai] Mode: ${mode || "chat"} | Complexity: ${complexity} | Model: ${selectedModel}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...userMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[elite-ai] Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht. Bitte warte kurz und versuche es erneut." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits aufgebraucht. Bitte lade dein Konto auf." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: `AI Gateway Fehler (${response.status})` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream the model name as first SSE comment so the client can display it
    const modelInfo = `data: {"model":"${selectedModel}","complexity":"${complexity}"}\n\n`;
    const encoder = new TextEncoder();

    const transformedStream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`:model ${selectedModel}\n\n`));
        const reader = response.body!.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      }
    });

    return new Response(transformedStream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("[elite-ai] Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unbekannter Fehler"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
