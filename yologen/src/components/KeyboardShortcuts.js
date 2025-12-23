'use client';

import { MdKeyboard, MdClose } from 'react-icons/md';
import { FiCommand } from 'react-icons/fi';

export default function KeyboardShortcuts({ isOpen, onClose }) {
  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: ['Ctrl', 'N'], description: 'Next image', mac: ['⌘', 'N'] },
        { keys: ['Ctrl', 'P'], description: 'Previous image', mac: ['⌘', 'P'] },
        { keys: ['1-9'], description: 'Switch to class 1-9', mac: ['1-9'] },
      ]
    },
    {
      category: 'Annotation',
      items: [
        { keys: ['Click + Drag'], description: 'Draw bounding box', mac: ['Click + Drag'] },
        { keys: ['Delete'], description: 'Remove selected annotation', mac: ['Delete'] },
        { keys: ['Esc'], description: 'Deselect annotation', mac: ['Esc'] },
      ]
    },
    {
      category: 'View',
      items: [
        { keys: ['Ctrl', '+'], description: 'Zoom in', mac: ['⌘', '+'] },
        { keys: ['Ctrl', '-'], description: 'Zoom out', mac: ['⌘', '-'] },
        { keys: ['Ctrl', '0'], description: 'Reset zoom', mac: ['⌘', '0'] },
      ]
    },
    {
      category: 'Editing',
      items: [
        { keys: ['Ctrl', 'Z'], description: 'Undo', mac: ['⌘', 'Z'] },
        { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo', mac: ['⌘', 'Shift', 'Z'] },
        { keys: ['Ctrl', 'S'], description: 'Save (auto-save enabled)', mac: ['⌘', 'S'] },
      ]
    }
  ];

  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MdKeyboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Keyboard Shortcuts
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Speed up your workflow with these shortcuts
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="space-y-6">
            {shortcuts.map((section, idx) => (
              <div key={idx}>
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  {section.category}
                </h4>
                <div className="space-y-2">
                  {section.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                    >
                      <span className="text-gray-900 dark:text-white text-sm">
                        {item.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {(isMac ? item.mac : item.keys).map((key, keyIdx) => (
                          <span key={keyIdx} className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-900 dark:text-white shadow-sm">
                              {key}
                            </kbd>
                            {keyIdx < (isMac ? item.mac : item.keys).length - 1 && (
                              <span className="text-gray-400 text-xs">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-start gap-3">
              <FiCommand className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                  Pro Tip
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Use number keys (1-9) to quickly switch between classes while annotating. 
                  This allows you to annotate multiple object types without using the mouse.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

