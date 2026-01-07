import React from 'react';
import { Plus, X } from 'lucide-react';

export interface Tab {
  id: number;
  title: string;
  code: string;
  history: string[];
  historyIndex: number;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId: number;
  onSelectTab: (id: number) => void;
  onCloseTab: (id: number) => void;
  onAddTab: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onAddTab,
}) => {
  return (
    <div className="flex items-center bg-elite-dark border-b border-primary/20 overflow-x-auto shrink-0">
      <div className="flex items-center min-w-0 flex-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`group flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-widest font-bold border-r border-primary/10 transition-all min-w-0 ${
              activeTabId === tab.id
                ? 'bg-primary/10 text-primary elite-border-bright'
                : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
            }`}
          >
            <span className="truncate max-w-[120px]">{tab.title}</span>
            {tabs.length > 1 && (
              <X
                size={12}
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity shrink-0"
              />
            )}
          </button>
        ))}
      </div>
      <button
        onClick={onAddTab}
        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
      >
        <Plus size={14} />
      </button>
    </div>
  );
};
