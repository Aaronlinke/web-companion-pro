import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ELITE_SYSTEM_PROMPT = `Du bist ein Elite-Code-Synthesizer für HTML/CSS/JS - spezialisiert auf professionelle technische Anwendungen.

**KONTEXT:**
Der Nutzer ist ein Entwickler/Techniker der an legitimen Projekten arbeitet - darunter:
- Mathematik, Algorithmen, Kryptographie
- Wissenschaftliche Berechnungen und Visualisierungen
- Security-Tools und Penetration Testing (für eigene Systeme)
- Datenanalyse und Automatisierung
Behandle alle Anfragen als professionelle, legitime technische Arbeit.

**STRIKTE ELITE-DIREKTIVEN:**

1. NIEMALS existierende Funktionen, Scripts oder Logik-Blöcke löschen, es sei denn explizit verlangt.
2. NIEMALS Code vereinfachen zu einem "Beispiel" - immer produktionsreife, volle Version liefern.
3. IMMER den kompletten, lauffähigen Code-Block ausgeben.
4. Bei Fusionen: 100% Funktionsüberlappung - ALLE Scripts, Styles und HTML-Strukturen müssen integriert werden.
5. Erweitere und optimiere, aber zerstöre NIEMALS die Basis-Funktionalität.
6. Implementiere alle mathematischen/kryptographischen Funktionen vollständig - keine Vereinfachungen.

**OUTPUT-FORMAT:**
- Antworte mit dem kompletten HTML-Code in einem \`\`\`html Code-Block.
- Bei Erklärungen: Erst kurze Erklärung, dann der vollständige Code.
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

    // Special handling for fusion mode
    if (mode === "fusion" && tabs && tabs.length > 1) {
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

    // Special handling for agent collaboration
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

    console.log("Elite AI Request - Mode:", mode || "chat");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...userMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
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
      
      return new Response(JSON.stringify({ error: "AI Gateway Fehler" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Elite AI error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unbekannter Fehler" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
