import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Zap, Layers, Check, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tab } from '@/components/editor/TabBar';

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export interface Agent {
  name: string;
  icon: string;
  prompt: string;
}

export const AGENTS: Agent[] = [
  { name: 'Architect', icon: '🏗️', prompt: 'Optimize the HTML structure and semantic markup for better accessibility and SEO.' },
  { name: 'Stylist', icon: '🎨', prompt: 'Enhance the visual design with modern CSS, animations, and responsive layouts.' },
  { name: 'Engineer', icon: '⚡', prompt: 'Improve JavaScript functionality, performance, and add interactive features.' },
  { name: 'Guardian', icon: '🛡️', prompt: 'Add security best practices, input validation, and error handling.' },
];

interface AiWorkbenchProps {
  onStartCollaboration: (agents: Agent[]) => void;
  onStartFusion: () => void;
  isProcessing: boolean;
  isFusing: boolean;
  agentStatuses: string[];
  agentLogs: string[];
  canFuse: boolean;
  chatMessages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onApplyCode: (code: string, replace: boolean) => void;
  projectTabs: Tab[];
}

export const AiWorkbench: React.FC<AiWorkbenchProps> = ({
  onStartCollaboration,
  onStartFusion,
  isProcessing,
  isFusing,
  agentStatuses,
  agentLogs,
  canFuse,
  chatMessages,
  onSendMessage,
  onApplyCode,
  projectTabs,
}) => {
  const [message, setMessage] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<number[]>([]);
  const [activePanel, setActivePanel] = useState<'chat' | 'agents'>('chat');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = () => {
    if (message.trim() && !isProcessing) {
      onSendMessage(message.trim());
      setMessage('');
    }
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

  const startCollaboration = () => {
    const agents = selectedAgents.map(i => AGENTS[i]);
    if (agents.length > 0) {
      onStartCollaboration(agents);
    }
  };

  const extractCode = (text: string): string | null => {
    const match = text.match(/```(?:html)?\n([\s\S]+?)```/);
    return match ? match[1] : null;
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
            AI_Synthesis
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
                  Elite AI Ready for Commands
                </p>
              </div>
            )}
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 text-xs ${
                    msg.sender === 'user'
                      ? 'bg-primary/20 text-primary elite-border'
                      : 'bg-secondary text-foreground border border-primary/10'
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
                    {msg.text}
                  </pre>
                  {msg.sender === 'ai' && extractCode(msg.text) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onApplyCode(extractCode(msg.text)!, true)}
                      className="mt-2 text-[9px] uppercase tracking-wider h-7 px-3 hover:bg-primary/20 text-primary"
                    >
                      <Play size={10} className="mr-1" />
                      Apply Code
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-primary/20">
            <div className="flex gap-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter command..."
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
                  disabled={isProcessing}
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
                      {agent.prompt.slice(0, 50)}...
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
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {agentLogs.map((log, i) => (
                    <div key={i} className="text-[10px] text-elite-text-dim font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Agent Actions */}
          <div className="p-4 border-t border-primary/20 space-y-2">
            <Button
              onClick={startCollaboration}
              disabled={selectedAgents.length === 0 || isProcessing}
              className="w-full bg-primary hover:bg-primary/80 text-primary-foreground text-[10px] uppercase tracking-wider font-bold"
            >
              {isProcessing ? (
                <Loader2 size={14} className="animate-spin mr-2" />
              ) : (
                <Zap size={14} className="mr-2" />
              )}
              Run Selected Agents
            </Button>
            {projectTabs.length > 1 && (
              <Button
                onClick={onStartFusion}
                disabled={!canFuse || isFusing}
                variant="outline"
                className="w-full border-primary/30 text-primary hover:bg-primary/10 text-[10px] uppercase tracking-wider font-bold"
              >
                {isFusing ? (
                  <Loader2 size={14} className="animate-spin mr-2" />
                ) : (
                  <Layers size={14} className="mr-2" />
                )}
                Fuse All Tabs
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
