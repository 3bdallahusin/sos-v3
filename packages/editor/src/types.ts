import type { Block, PartialBlock, BlockNoteEditor } from '@blocknote/core';

export type { Block, PartialBlock, BlockNoteEditor };

export interface SOSEditorProps {
  /**
   * Initial block content for the editor.
   */
  initialContent?: any[];

  /**
   * Callback fired whenever content changes, providing the updated Block[] array,
   * extracted plain text preview, and word count.
   */
  onUpdate?: (document: any[], plainText: string, wordCount: number) => void;

  /**
   * Simpler callback fired on document change.
   */
  onChange?: (document: any[]) => void;

  /**
   * Read-only mode flag.
   */
  readOnly?: boolean;

  /**
   * Placeholder string for empty blocks.
   */
  placeholder?: string;

  /**
   * Autofocus the editor on mount.
   */
  autoFocus?: boolean;

  /**
   * Additional root container CSS classes.
   */
  className?: string;

  /**
   * Layout mode:
   * - 'centered': Centered document column (max-w-[760px] mx-auto) for Library reading/writing.
   * - 'wide-margin': Responsive wide-margin layout with full-width container for Notes workspace.
   */
  layout?: 'centered' | 'wide-margin';

  /**
   * Optional callback when BlockNoteEditor instance is initialized.
   */
  onEditorReady?: (editor: BlockNoteEditor) => void;

  /**
   * Optional scroll handler on the editor scroll container (used by Notes canvas synchronization).
   */
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;

  /**
   * Text direction: 'auto' | 'ltr' | 'rtl' (supports Arabic RTL and mixed Arabic/English text).
   */
  dir?: 'auto' | 'ltr' | 'rtl';

  /**
   * Optional Folder Context providing child folders, files, and mutation handlers.
   */
  folderContext?: any;

  /**
   * Quick folder creation callback for slash menu /folder.
   */
  onCreateFolder?: (name?: string) => Promise<{ id: string }>;
}

// Backwards compatibility alias
export type SosEditorProps = SOSEditorProps;
