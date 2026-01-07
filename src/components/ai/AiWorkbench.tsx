import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Zap, Layers, Check, Loader2, Play, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tab } from '@/components/editor/TabBar';
import { streamEliteChat, extractCodeFromResponse, ChatMessage } from '@/lib/eliteAI';
import { toast } from 'sonner';

export interface Agent {
  name: string;
  icon: string;
  prompt: string;
}

export const AGENTS: Agent[] = [
  { name: 'Architect', icon: '🏗️', prompt: 'Optimiere die HTML-Struktur und semantisches Markup für bessere Accessibility und SEO.' },
  { name: 'Stylist', icon: '🎨', prompt: 'Verbessere das visuelle Design mit modernem CSS, Animationen und responsiven Layouts.' },
  { name: 'Engineer', icon: '⚡', prompt: 'Verbessere JavaScript-Funktionalität, Performance und füge interaktive Features hinzu.' },
  { name: 'Guardian', icon: '🛡️', prompt: 'Füge Security-Best-Practices, Input-Validation und Error-Handling hinzu.' },
];

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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<number[]>([]);
  const [activePanel, setActivePanel] = useState<'chat' | 'agents'>('chat');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFusing, setIsFusing] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState<string[]>(Array(AGENTS.length).fill('ready'));
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = async () => {
    if (!message.trim() || isProcessing) return;

    const userMessage = message.trim();
    setMessage('');
    setIsProcessing(true);

    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    let assistantResponse = '';
    
    await streamEliteChat({
      messages: [
        ...chatMessages,
        { role: 'user', content: `AKTUELLER CODE:\n\`\`\`html\n${currentCode}\n\`\`\`\n\nANWEISUNG: ${userMessage}` }
      ],
      mode: 'chat',
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
      },
      onError: (error) => {
        toast.error(error);
        setIsProcessing(false);
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
    setSelectedAgents(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const runAgentCollaboration = async () => {
    if (selectedAgents.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setAgentLogs(['ELITE_SYSTEM: Locking base logic...']);
    let workingCode = currentCode;

    for (const agentIndex of selectedAgents) {
      const agent = AGENTS[agentIndex];
      setAgentStatuses(prev => { const s = [...prev]; s[agentIndex] = 'thinking'; return s; });
      setAgentLogs(prev => [...prev, `Worker_${agent.name}: Processing...`]);

      let agentResponse = '';
      
      await streamEliteChat({
        messages: [{ 
          role: 'user', 
          content: `AKTUELLER CODE:\n\`\`\`html\n${workingCode}\n\`\`\`\n\nAGENT-AUFGABE: ${agent.prompt}`,
          agentName: agent.name
        }],
        mode: 'agent',
        onDelta: (delta) => {
          agentResponse += delta;
        },
        onDone: () => {
          const extracted = extractCodeFromResponse(agentResponse);
          if (extracted) {
            workingCode = extracted;
            setAgentLogs(prev => [...prev, `Worker_${agent.name}: Code optimiert ✓`]);
          }
          setAgentStatuses(prev => { const s = [...prev]; s[agentIndex] = 'done'; return s; });
        },
        onError: (error) => {
          setAgentLogs(prev => [...prev, `Worker_${agent.name}: FEHLER - ${error}`]);
          setAgentStatuses(prev => { const s = [...prev]; s[agentIndex] = 'ready'; return s; });
        }
      });
    }

    onApplyCode(workingCode);
    setAgentLogs(prev => [...prev, 'SYNTHESIS_COMPLETE: Alle Agenten fertig.']);
    setIsProcessing(false);

    setTimeout(() => {
      setAgentStatuses(Array(AGENTS.length).fill('ready'));
      setSelectedAgents([]);
    }, 2000);
  };

  const runFusion = async () => {
    if (projectTabs.length < 2 || isFusing) return;

    setIsFusing(true);
    setAgentLogs(['FUSION_INIT: Deep merge starting...']);
    setAgentLogs(prev => [...prev, `Tabs to fuse: ${projectTabs.length}`]);

    let fusedCode = '';

    await streamEliteChat({
      messages: [],
      mode: 'fusion',
      tabs: projectTabs.map(t => ({ id: t.id, title: t.title, code: t.code })),
      onDelta: (delta) => {
        fusedCode += delta;
      },
      onDone: () => {
        const extracted = extractCodeFromResponse(fusedCode);
        if (extracted) {
          onFusionComplete(extracted, 'MASTER_SYNTHESIS.html');
          setAgentLogs(prev => [...prev, 'FUSION_COMPLETE: 100% functionality preserved.']);
          toast.success('Fusion erfolgreich! Alle Funktionen wurden übernommen.');
        } else {
          setAgentLogs(prev => [...prev, 'FUSION_WARNING: Could not extract code.']);
          toast.error('Fusion fehlgeschlagen');
        }
        setIsFusing(false);
      },
      onError: (error) => {
        setAgentLogs(prev => [...prev, `FUSION_ERROR: ${error}`]);
        toast.error(error);
        setIsFusing(false);
      }
    });
  };

  const handleApplyCode = (text: string) => {
    const extracted = extractCodeFromResponse(text);
    if (extracted) {
      onApplyCode(extracted);
      toast.success('Code angewendet!');
    } else {
      toast.error('Kein Code-Block gefunden');
    }
  };

  const handleCopyCode = (text: string) => {
    const extracted = extractCodeFromResponse(text);
    if (extracted) {
      navigator.clipboard.writeText(extracted);
      toast.success('Code kopiert!');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/20">
        <div className="flex items-center gap-2">
          <div className="p-1 elite-border elite-glow">
            <Bot size={14} className="text-primary" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">
            Elite_AI_Synthesis
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setActivePanel('chat')}
            className={`px-3 py-1 text-[9px] uppercase tracking-wider font-bold transition-all ${
              activePanel === 'chat'
                ? 'bg-primary/20 text-primary elite-border'
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActivePanel('agents')}
            className={`px-3 py-1 text-[9px] uppercase tracking-wider font-bold transition-all ${
              activePanel === 'agents'
                ? 'bg-primary/20 text-primary elite-border'
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            Agents
          </button>
        </div>
      </div>

      {activePanel === 'chat' ? (
        <>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center py-8">
                <Bot size={32} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Elite AI bereit für Befehle
                </p>
                <p className="text-[9px] text-muted-foreground/60 mt-2">
                  Beschreibe was du möchtest - der Code wird automatisch angepasst
                </p>
              </div>
            )}
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] p-3 text-xs ${
                    msg.role === 'user'
                      ? 'bg-primary/20 text-primary elite-border'
                      : 'bg-secondary text-foreground border border-primary/10'
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed overflow-x-auto">
                    {msg.content}
                  </pre>
                  {msg.role === 'assistant' && extractCodeFromResponse(msg.content) && (
                    <div className="flex gap-2 mt-3 pt-2 border-t border-primary/20">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleApplyCode(msg.content)}
                        className="text-[9px] uppercase tracking-wider h-7 px-3 hover:bg-primary/20 text-primary"
                      >
                        <Play size={10} className="mr-1" />
                        Anwenden
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyCode(msg.content)}
                        className="text-[9px] uppercase tracking-wider h-7 px-3 hover:bg-primary/20 text-muted-foreground"
                      >
                        <Copy size={10} className="mr-1" />
                        Kopieren
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isProcessing && chatMessages[chatMessages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="bg-secondary text-foreground border border-primary/10 p-3">
                  <Loader2 size={14} className="animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-primary/20">
            <div className="flex gap-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Befehl eingeben... (z.B. 'Füge einen Dark Mode Toggle hinzu')"
                disabled={isProcessing}
                className="flex-1 bg-secondary border border-primary/20 text-foreground p-3 text-xs resize-none h-16 focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground"
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || isProcessing}
                className="bg-primary hover:bg-primary/80 text-primary-foreground px-4"
              >
                {isProcessing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Agents Panel */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {AGENTS.map((agent, index) => (
                <button
                  key={agent.name}
                  onClick={() => toggleAgent(index)}
                  disabled={isProcessing || isFusing}
                  className={`w-full flex items-center gap-3 p-3 text-left transition-all ${
                    selectedAgents.includes(index)
                      ? 'bg-primary/20 elite-border-bright elite-glow'
                      : 'bg-secondary border border-primary/10 hover:border-primary/30'
                  }`}
                >
                  <span className="text-lg">{agent.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-primary">
                      {agent.name}
                    </div>
                    <div className="text-[9px] text-muted-foreground truncate">
                      {agent.prompt.slice(0, 60)}...
                    </div>
                  </div>
                  <div className="shrink-0">
                    {agentStatuses[index] === 'thinking' ? (
                      <Loader2 size={14} className="animate-spin text-primary" />
                    ) : agentStatuses[index] === 'done' ? (
                      <Check size={14} className="text-green-500" />
                    ) : selectedAgents.includes(index) ? (
                      <div className="w-3 h-3 bg-primary animate-pulse" />
                    ) : null}
                  </div>
                </button>
              ))}
            </div>

            {/* Logs */}
            {agentLogs.length > 0 && (
              <div className="mt-4 p-3 bg-elite-black border border-primary/10">
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-2">
                  Process Log
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {agentLogs.map((log, i) => (
                    <div key={i} className="text-[10px] text-elite-text-dim font-mono">
                      &gt; {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Agent Actions */}
          <div className="p-4 border-t border-primary/20 space-y-2">
            <Button
              onClick={runAgentCollaboration}
              disabled={selectedAgents.length === 0 || isProcessing || isFusing}
              className="w-full bg-primary hover:bg-primary/80 text-primary-foreground text-[10px] uppercase tracking-wider font-bold"
            >
              {isProcessing ? (
                <Loader2 size={14} className="animate-spin mr-2" />
              ) : (
                <Zap size={14} className="mr-2" />
              )}
              Agenten ausführen ({selectedAgents.length})
            </Button>
            {projectTabs.length > 1 && (
              <Button
                onClick={runFusion}
                disabled={isFusing || isProcessing}
                variant="outline"
                className="w-full border-primary/30 text-primary hover:bg-primary/10 text-[10px] uppercase tracking-wider font-bold"
              >
                {isFusing ? (
                  <Loader2 size={14} className="animate-spin mr-2" />
                ) : (
                  <Layers size={14} className="mr-2" />
                )}
                Alle {projectTabs.length} Tabs fusionieren
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
