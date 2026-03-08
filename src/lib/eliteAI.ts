export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  agentName?: string;
  model?: string;
  complexity?: string;
}

export interface Tab {
  id: number;
  title: string;
  code: string;
}

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elite-ai`;

export async function streamEliteChat({
  messages,
  mode,
  tabs,
  onDelta,
  onDone,
  onError,
  onModelSelected,
}: {
  messages: ChatMessage[];
  mode?: "chat" | "fusion" | "agent";
  tabs?: Tab[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  onModelSelected?: (model: string, complexity: string) => void;
}) {
  try {
    const response = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, mode, tabs }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Fehler: ${response.status}`;
      onError(errorMessage);
      return;
    }

    if (!response.body) {
      onError("Keine Antwort vom Server");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.trim() === "") continue;

        // SSE comment with model info from server
        if (line.startsWith(":model ")) {
          const modelName = line.slice(7).trim();
          // parse complexity from model name
          const complexityMap: Record<string, string> = {
            "google/gemini-2.5-flash-lite": "simple",
            "google/gemini-2.5-flash": "medium",
            "google/gemini-3-flash-preview": "complex",
          };
          onModelSelected?.(modelName, complexityMap[modelName] || "medium");
          continue;
        }

        if (line.startsWith(":")) continue; // other SSE comments
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }

    // Final flush
    if (buffer.trim()) {
      for (let raw of buffer.split("\n")) {
        if (!raw || raw.startsWith(":") || !raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  } catch (error) {
    console.error("Stream error:", error);
    onError(error instanceof Error ? error.message : "Verbindungsfehler");
  }
}

export function extractCodeFromResponse(text: string): string | null {
  // Try to find any code block (html, python, typescript, js, sql, json, bash, yaml, etc.)
  const match = text.match(/```(?:\w+)?\n([\s\S]+?)```/);
  return match ? match[1].trim() : null;
}

export function detectLanguageFromResponse(text: string): string {
  const match = text.match(/```(\w+)\n/);
  return match ? match[1] : "html";
}
