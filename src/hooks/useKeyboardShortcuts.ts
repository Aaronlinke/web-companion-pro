import { useEffect } from 'react';

interface ShortcutHandlers {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onTogglePreview?: () => void;
  onToggleAi?: () => void;
  onNewTab?: () => void;
  onShowShortcuts?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Skip when typing in inputs/textareas (except specific shortcuts)
      const target = e.target as HTMLElement;
      const inEditor = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT';

      if (ctrl && e.key === 's') {
        e.preventDefault();
        handlers.onSave?.();
        return;
      }
      if (ctrl && e.key === 'z' && !e.shiftKey && !inEditor) {
        e.preventDefault();
        handlers.onUndo?.();
        return;
      }
      if ((ctrl && e.key === 'y') || (ctrl && e.shiftKey && e.key === 'z') && !inEditor) {
        e.preventDefault();
        handlers.onRedo?.();
        return;
      }
      if (ctrl && e.key === 'p') {
        e.preventDefault();
        handlers.onTogglePreview?.();
        return;
      }
      if (ctrl && e.key === 'i') {
        e.preventDefault();
        handlers.onToggleAi?.();
        return;
      }
      if (ctrl && e.key === 't') {
        e.preventDefault();
        handlers.onNewTab?.();
        return;
      }
      if (e.key === '?' && !inEditor) {
        handlers.onShowShortcuts?.();
        return;
      }
    };

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [handlers]);
}
