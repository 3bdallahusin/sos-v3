import React from 'react';
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  insertOrUpdateBlockForSlashMenu
} from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import { Folder, AlertCircle } from 'lucide-react';
import { FolderBlockComponent } from './FolderBlockComponent.js';
import { CalloutBlockComponent } from './CalloutBlockComponent.js';

export const folderBlockSpec = createReactBlockSpec(
  {
    type: 'folder' as const,
    propSchema: {
      folderId: { default: '' }
    },
    content: 'none' as const
  },
  {
    render: (props) => {
      return <FolderBlockComponent folderId={props.block.props.folderId} />;
    }
  }
);

export const calloutBlockSpec = createReactBlockSpec(
  {
    type: 'callout' as const,
    propSchema: {
      icon: { default: '💡' }
    },
    content: 'inline' as const
  },
  {
    render: (props) => {
      return (
        <CalloutBlockComponent
          icon={props.block.props.icon}
          onUpdateIcon={(icon) => {
            props.editor.updateBlock(props.block, {
              type: 'callout',
              props: { icon }
            } as any);
          }}
          contentRef={props.contentRef}
        />
      );
    }
  }
);

export const sosSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    folder: folderBlockSpec(),
    callout: calloutBlockSpec()
  }
});

export type SosSchema = typeof sosSchema;

/**
 * Creates custom slash menu items for SOS (/folder and /callout)
 */
export function getSosCustomSlashMenuItems(
  editor: any,
  onCreateFolder?: (name?: string) => Promise<{ id: string }>
) {
  return [
    {
      title: 'Folder',
      onItemClick: async () => {
        let folderId = `folder-${Date.now()}`;
        if (onCreateFolder) {
          try {
            const created = await onCreateFolder('Untitled Study Folder');
            if (created?.id) folderId = created.id;
          } catch (err) {
            console.warn('Failed to pre-create folder for slash block:', err);
          }
        }
        insertOrUpdateBlockForSlashMenu(editor, {
          type: 'folder',
          props: { folderId }
        } as any);
      },
      aliases: ['folder', 'dir', 'directory', 'subfolder', 'collection', 'database'],
      group: 'Advanced',
      subtext: 'Embed an inline folder with Gallery & Table views',
      icon: <Folder className="w-4 h-4 text-[#A1A1AA]" />
    },
    {
      title: 'Callout',
      onItemClick: () => {
        insertOrUpdateBlockForSlashMenu(editor, {
          type: 'callout',
          props: { icon: '💡' }
        } as any);
      },
      aliases: ['callout', 'alert', 'note', 'box', 'banner'],
      group: 'Advanced',
      subtext: 'Highlight important notes or concepts',
      icon: <AlertCircle className="w-4 h-4 text-[#A1A1AA]" />
    }
  ];
}
