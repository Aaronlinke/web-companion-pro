import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Zap, Layers, Check, Loader2, Play, Copy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tab } from '@/components/editor/TabBar';
import { streamEliteChat, extractCodeFromResponse, ChatMessage } from '@/lib/eliteAI';
import { toast } from 'sonner';

export interface Agent {
  name: string;
  icon: string;
  prompt: string;
  color: string;
}

export const AGENTS: Agent[] = [
  { name: 'Architect', icon: '🏗️', prompt: 'Optimiere die HTML-Struktur und semantisches Markup für bessere Accessibility und SEO.', color: 'text-blue-400' },
  { name: 'Stylist', icon: '🎨', prompt: 'Verbessere das visuelle Design mit modernem CSS, Animationen und responsiven Layouts.', color: 'text-pink-400' },
  { name: 'Engineer', icon: '⚡', prompt: 'Verbessere JavaScript-Funktionalität, Performance und füge interaktive Features hinzu.', color: 'text-yellow-400' },
  { name: 'Guardian', icon: '🛡️', prompt: 'Füge Security-Best-Practices, Input-Validation und Error-Handling hinzu.', color: 'text-green-400' },
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFusing, setIsFusing] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState<string[]>(Array(AGENTS.length).fill('ready'));
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
      onDone: () => setIsProcessing(false),
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
    toast.success('Agenten-Optimierung abgeschlossen');
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
          toast.success('Fusion erfolgreich! Alle Funktionen übernommen.');
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
      toast.success('Code angewendet');
    }
  };

  const handleCopyCode = (text: string) => {
    const extracted = extractCodeFromResponse(text);
    if (extracted) {
      navigator.clipboard.writeText(extracted);
      toast.success('Kopiert');
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <Sparkles size={12} className="text-primary" />
          <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">AI</span>
        </div>
      </div>

      {/* Agents Row */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-secondary/20">
        {AGENTS.map((agent, index) => (
          <button
            key={agent.name}
            onClick={() => toggleAgent(index)}
            disabled={isProcessing || isFusing}
            className={`flex items-center gap-1 px-2 py-1 text-[9px] rounded transition-all ${
              selectedAgents.includes(index)
                ? 'bg-primary/20 text-primary ring-1 ring-primary/50'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            <span>{agent.icon}</span>
            {agentStatuses[index] === 'thinking' ? (
              <Loader2 size={10} className="animate-spin" />
            ) : agentStatuses[index] === 'done' ? (
              <Check size={10} className="text-green-500" />
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
            Run
          </Button>
        )}

        {projectTabs.length > 1 && (
          <Button
            size="sm"
            variant="outline"
            onClick={runFusion}
            disabled={isFusing || isProcessing}
            className="h-6 px-2 text-[9px] border-primary/30 text-primary hover:bg-primary/10"
          >
            {isFusing ? <Loader2 size={10} className="animate-spin mr-1" /> : <Layers size={10} className="mr-1" />}
            Fuse {projectTabs.length}
          </Button>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatMessages.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Bot size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-[10px]">Beschreibe was du brauchst</p>
          </div>
        )}
        {chatMessages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[95%] p-2.5 rounded text-xs ${
              msg.role === 'user'
                ? 'bg-primary/15 text-primary'
                : 'bg-secondary text-foreground'
            }`}>
              <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed overflow-x-auto">
                {msg.content}
              </pre>
              {msg.role === 'assistant' && extractCodeFromResponse(msg.content) && (
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
        ))}
        {isProcessing && chatMessages[chatMessages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-secondary p-2.5 rounded">
              <Loader2 size={14} className="animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-border">
        <div className="flex gap-1.5">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Was soll ich ändern?"
            disabled={isProcessing}
            rows={1}
            className="flex-1 bg-secondary border-0 text-foreground p-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 rounded placeholder:text-muted-foreground"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isProcessing}
            size="sm"
            className="bg-primary hover:bg-primary/80 text-primary-foreground px-3"
          >
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </Button>
        </div>
      </div>
    </div>
  );
};