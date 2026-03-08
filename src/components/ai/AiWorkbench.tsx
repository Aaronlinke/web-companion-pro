import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Zap, Layers, Check, Loader2, Play, Copy, Sparkles, Cpu, Trash2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tab } from '@/components/editor/TabBar';
import { streamEliteChat, extractCodeFromResponse, detectLanguageFromResponse, ChatMessage } from '@/lib/eliteAI';
import { toast } from 'sonner';

export interface Agent {
  name: string;
  icon: string;
  prompt: string;
  color: string;
}

export const AGENTS: Agent[] = [
  { name: 'Architect', icon: '🏗️', prompt: 'Optimiere die HTML-Struktur und semantisches Markup für bessere Accessibility und SEO.', color: 'text-blue-400' },
  { name: 'Stylist',   icon: '🎨', prompt: 'Verbessere das visuelle Design mit modernem CSS, Animationen und responsiven Layouts.', color: 'text-pink-400' },
  { name: 'Engineer',  icon: '⚡', prompt: 'Verbessere JavaScript-Funktionalität, Performance und füge interaktive Features hinzu.', color: 'text-yellow-400' },
  { name: 'Guardian',  icon: '🛡️', prompt: 'Füge Security-Best-Practices, Input-Validation und Error-Handling hinzu.', color: 'text-green-400' },
];

const MODEL_LABELS: Record<string, { label: string; color: string }> = {
  'google/gemini-2.5-flash-lite': { label: 'Lite', color: 'text-green-400' },
  'google/gemini-2.5-flash':      { label: 'Flash', color: 'text-yellow-400' },
  'google/gemini-3-flash-preview':{ label: 'Pro',  color: 'text-primary' },
};

interface AiWorkbenchProps {
  currentCode: string;
  onApplyCode: (code: string) => void;
  projectTabs: Tab[];
  onFusionComplete: (code: string, title: string) => void;
}

export const AiWorkbench: React.FC<AiWorkbenchProps> = ({
  currentCode,
  onApplyCode,
  projectTabs,
  onFusionComplete,
}) => {
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<(ChatMessage & { model?: string; complexity?: string; timestamp?: number })[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFusing, setIsFusing] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState<string[]>(Array(AGENTS.length).fill('ready'));
  const [activeModel, setActiveModel] = useState<string>('');
  const [collapsedMessages, setCollapsedMessages] = useState<Set<number>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const COLLAPSE_THRESHOLD = 600; // chars — collapse messages longer than this

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleSend = async () => {
    if (!message.trim() || isProcessing) return;

    const userMessage = message.trim();
    setMessage('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsProcessing(true);
    setActiveModel('');

    setChatMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: Date.now() }]);

    let assistantResponse = '';

    await streamEliteChat({
      messages: [
        ...chatMessages.filter(m => !m.model), // only actual chat history
        { role: 'user', content: `AKTUELLER CODE:\n\`\`\`html\n${currentCode}\n\`\`\`\n\nANWEISUNG: ${userMessage}` }
      ],
      mode: 'chat',
      onModelSelected: (model, complexity) => {
        setActiveModel(model);
        setChatMessages(prev => {
          // Add model info to last user message
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, model, complexity } : m);
        });
      },
      onDelta: (delta) => {
        assistantResponse += delta;
        setChatMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantResponse } : m);
          }
          return [...prev, { role: 'assistant', content: assistantResponse }];
        });
      },
      onDone: () => {
        setIsProcessing(false);
        setActiveModel('');
      },
      onError: (error) => {
        toast.error(error);
        setIsProcessing(false);
        setActiveModel('');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleAgent = (index: number) => {
    setSelectedAgents(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };

  const runAgentCollaboration = async () => {
    if (selectedAgents.length === 0 || isProcessing) return;
    setIsProcessing(true);
    let workingCode = currentCode;

    for (const agentIndex of selectedAgents) {
      const agent = AGENTS[agentIndex];
      setAgentStatuses(prev => { const s = [...prev]; s[agentIndex] = 'thinking'; return s; });

      let agentResponse = '';

      await streamEliteChat({
        messages: [{
          role: 'user',
          content: `AKTUELLER CODE:\n\`\`\`html\n${workingCode}\n\`\`\`\n\nAGENT-AUFGABE: ${agent.prompt}`,
          agentName: agent.name
        }],
        mode: 'agent',
        onDelta: (delta) => { agentResponse += delta; },
        onDone: () => {
          const extracted = extractCodeFromResponse(agentResponse);
          if (extracted) workingCode = extracted;
          setAgentStatuses(prev => { const s = [...prev]; s[agentIndex] = 'done'; return s; });
        },
        onError: () => {
          setAgentStatuses(prev => { const s = [...prev]; s[agentIndex] = 'ready'; return s; });
        }
      });
    }

    onApplyCode(workingCode);
    toast.success(`${selectedAgents.length} Agenten fertig ✓`);
    setIsProcessing(false);

    setTimeout(() => {
      setAgentStatuses(Array(AGENTS.length).fill('ready'));
      setSelectedAgents([]);
    }, 1500);
  };

  const runFusion = async () => {
    if (projectTabs.length < 2 || isFusing) return;
    setIsFusing(true);
    let fusedCode = '';

    await streamEliteChat({
      messages: [],
      mode: 'fusion',
      tabs: projectTabs.map(t => ({ id: t.id, title: t.title, code: t.code })),
      onDelta: (delta) => { fusedCode += delta; },
      onDone: () => {
        const extracted = extractCodeFromResponse(fusedCode);
        if (extracted) {
          onFusionComplete(extracted, 'MASTER_FUSION.html');
          toast.success('Fusion abgeschlossen! Alle Funktionen vereint.');
        } else {
          toast.error('Fusion konnte keinen Code extrahieren.');
        }
        setIsFusing(false);
      },
      onError: (error) => {
        toast.error(error);
        setIsFusing(false);
      }
    });
  };

  const handleApplyCode = (text: string) => {
    const extracted = extractCodeFromResponse(text);
    if (extracted) {
      onApplyCode(extracted);
      toast.success('Code angewendet ✓');
    } else {
      toast.error('Kein Code-Block gefunden');
    }
  };

  const handleCopyCode = (text: string) => {
    const extracted = extractCodeFromResponse(text);
    const toCopy = extracted || text;
    navigator.clipboard.writeText(toCopy);
    toast.success('Kopiert ✓');
  };

  const modelInfo = activeModel ? MODEL_LABELS[activeModel] : null;

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <Sparkles size={12} className="text-primary" />
          <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">AI Workbench</span>
        </div>
        <div className="flex items-center gap-2">
          {modelInfo && (
            <div className="flex items-center gap-1">
              <Cpu size={10} className={modelInfo.color} />
              <span className={`text-[9px] font-mono ${modelInfo.color}`}>{modelInfo.label}</span>
            </div>
          )}
          {chatMessages.length > 0 && !isProcessing && (
            <button
              onClick={() => { setChatMessages([]); setCollapsedMessages(new Set()); }}
              className="p-1 text-muted-foreground/40 hover:text-destructive rounded transition-colors"
              title="Verlauf löschen"
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Agents Row */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-secondary/20 flex-wrap">
        {AGENTS.map((agent, index) => (
          <button
            key={agent.name}
            onClick={() => toggleAgent(index)}
            disabled={isProcessing || isFusing}
            title={agent.name + ': ' + agent.prompt}
            className={`flex items-center gap-1 px-2 py-1 text-[9px] rounded transition-all ${
              selectedAgents.includes(index)
                ? 'bg-primary/20 text-primary ring-1 ring-primary/50'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            <span>{agent.icon}</span>
            <span className="hidden sm:inline">{agent.name}</span>
            {agentStatuses[index] === 'thinking' ? (
              <Loader2 size={10} className="animate-spin" />
            ) : agentStatuses[index] === 'done' ? (
              <Check size={10} className="text-primary" />
            ) : null}
          </button>
        ))}

        {selectedAgents.length > 0 && (
          <Button
            size="sm"
            onClick={runAgentCollaboration}
            disabled={isProcessing}
            className="h-6 px-2 text-[9px] bg-primary/20 text-primary hover:bg-primary/30 ml-auto"
          >
            <Zap size={10} className="mr-1" />
            Run {selectedAgents.length}
          </Button>
        )}

        {projectTabs.length > 1 && selectedAgents.length === 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={runFusion}
            disabled={isFusing || isProcessing}
            className="h-6 px-2 text-[9px] border-primary/30 text-primary hover:bg-primary/10 ml-auto"
          >
            {isFusing ? <Loader2 size={10} className="animate-spin mr-1" /> : <Layers size={10} className="mr-1" />}
            Fuse ({projectTabs.length})
          </Button>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatMessages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Bot size={28} className="mx-auto mb-3 opacity-20" />
            <p className="text-[10px] uppercase tracking-wider opacity-50">Beschreibe was du brauchst</p>
            <div className="mt-4 space-y-1">
              {["Füge ein Diagramm hinzu", "Mach es dunkler", "Baue einen RSA-Verschlüsseler"].map(hint => (
                <button
                  key={hint}
                  onClick={() => setMessage(hint)}
                  className="block w-full text-left px-2 py-1 text-[9px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded transition-colors"
                >
                  → {hint}
                </button>
              ))}
            </div>
          </div>
        )}
        {chatMessages.map((msg, index) => {
          const isLong = msg.content.length > COLLAPSE_THRESHOLD;
          const isCollapsed = isLong && collapsedMessages.has(index);
          const toggleCollapse = () =>
            setCollapsedMessages(prev => {
              const n = new Set(prev);
              n.has(index) ? n.delete(index) : n.add(index);
              return n;
            });
          const timestamp = msg.timestamp
            ? new Date(msg.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
            : null;

          return (
            <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {/* Timestamp + model badge */}
              <div className="flex items-center gap-1.5 mb-0.5">
                {msg.role === 'user' && msg.model && (
                  <>
                    <Cpu size={8} className={MODEL_LABELS[msg.model]?.color || 'text-muted-foreground'} />
                    <span className={`text-[8px] font-mono ${MODEL_LABELS[msg.model]?.color || 'text-muted-foreground'}`}>
                      {MODEL_LABELS[msg.model]?.label || msg.model}
                    </span>
                  </>
                )}
                {timestamp && (
                  <span className="text-[8px] text-muted-foreground/40 font-mono flex items-center gap-0.5">
                    <Clock size={7} /> {timestamp}
                  </span>
                )}
              </div>
              <div className={`max-w-[95%] p-2.5 rounded text-xs ${
                msg.role === 'user'
                  ? 'bg-primary/15 text-primary'
                  : 'bg-secondary text-foreground'
              }`}>
                <pre className={`whitespace-pre-wrap font-mono text-[11px] leading-relaxed overflow-x-auto ${isCollapsed ? 'max-h-36 overflow-hidden' : ''}`}>
                  {msg.content}
                </pre>
                {/* Collapse/expand for long messages */}
                {isLong && (
                  <button
                    onClick={toggleCollapse}
                    className="flex items-center gap-1 mt-1 text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isCollapsed ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
                    {isCollapsed ? 'Mehr anzeigen' : 'Weniger anzeigen'}
                  </button>
                )}
                {msg.role === 'assistant' && (
                  <div className="flex gap-1 mt-2 pt-2 border-t border-border">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleApplyCode(msg.content)}
                      className="text-[9px] h-6 px-2 text-primary hover:bg-primary/20"
                    >
                      <Play size={10} className="mr-1" />
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyCode(msg.content)}
                      className="text-[9px] h-6 px-2 text-muted-foreground hover:bg-secondary"
                    >
                      <Copy size={10} className="mr-1" />
                      Copy
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isProcessing && chatMessages[chatMessages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-secondary p-2.5 rounded flex items-center gap-2">
              <Loader2 size={12} className="animate-spin text-primary" />
              {activeModel && (
                <span className="text-[9px] font-mono text-primary">
                  {MODEL_LABELS[activeModel]?.label}...
                </span>
              )}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-border">
        <div className="flex gap-1.5 items-end">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Was soll ich bauen? (Enter = senden, Shift+Enter = Zeilenumbruch)"
            disabled={isProcessing}
            rows={1}
            className="flex-1 bg-secondary border-0 text-foreground p-2.5 text-sm sm:text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 rounded placeholder:text-muted-foreground min-h-[40px] sm:min-h-[32px] max-h-[120px]"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isProcessing}
            size="sm"
            className="bg-primary hover:bg-primary/80 text-primary-foreground px-3 shrink-0 h-10 sm:h-8 w-10 sm:w-auto"
          >
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </Button>
        </div>
        <p className="text-[8px] text-muted-foreground/40 mt-1 text-center">
          Smart routing: Lite → Flash → Pro je nach Aufgabe
        </p>
      </div>
    </div>
  );
};
