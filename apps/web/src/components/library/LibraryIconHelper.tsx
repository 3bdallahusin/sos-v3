import React from 'react';
import {
  Folder,
  FileText,
  PlayCircle,
  Headphones,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  Globe,
  HelpCircle,
  GraduationCap,
  FileCode,
  Zap,
  Brain,
  PenTool
} from 'lucide-react';
import type { SOSFileType } from '@sos/domain';

interface LibraryTypeIconProps {
  type: SOSFileType;
  icon?: string | null;
  className?: string;
  size?: number;
}

export const LibraryTypeIcon: React.FC<LibraryTypeIconProps> = ({
  type,
  className = 'w-4 h-4',
  size
}) => {
  const iconProps = {
    className: `${className} text-[#D4D4D8]`,
    ...(size ? { size } : {})
  };

  // Crisp monochrome Lucide type icons matching Stitch
  switch (type) {
    case 'folder':
      return <Folder {...iconProps} />;
    case 'pdf':
      return <FileText {...iconProps} />;
    case 'docx':
      return <FileText {...iconProps} />;
    case 'slides':
      return <Presentation {...iconProps} />;
    case 'spreadsheet':
      return <FileSpreadsheet {...iconProps} />;
    case 'image':
      return <ImageIcon {...iconProps} />;
    case 'video':
      return <PlayCircle {...iconProps} />;
    case 'audio':
      return <Headphones {...iconProps} />;
    case 'browser':
      return <Globe {...iconProps} />;
    case 'note':
      return <Zap {...iconProps} />;
    case 'flashcards':
      return <Brain {...iconProps} />;
    case 'quiz':
      return <HelpCircle {...iconProps} />;
    case 'exam':
      return <GraduationCap {...iconProps} />;
    case 'board':
      return <PenTool {...iconProps} />;
    default:
      return <FileCode {...iconProps} />;
  }
};

export function formatItemMetadata(item: {
  itemKind: 'folder' | 'file';
  fileType: SOSFileType;
  storage?: { sizeBytes?: number };
  artifactData?: { metrics?: any };
  childCount?: number;
}): string {
  if (item.itemKind === 'folder') {
    const count = item.childCount ?? 0;
    return `${count} ${count === 1 ? 'item' : 'items'}`;
  }

  const typeLabel = item.fileType.toUpperCase();
  const metrics = item.artifactData?.metrics || {};

  if (item.fileType === 'pdf' || item.fileType === 'docx') {
    const sizeStr = formatBytes(item.storage?.sizeBytes);
    if (metrics.pageCount) return `${typeLabel} • ${metrics.pageCount} pages`;
    return sizeStr ? `${typeLabel} • ${sizeStr}` : typeLabel;
  }

  if (item.fileType === 'slides') {
    if (metrics.slideCount) return `${typeLabel} • ${metrics.slideCount} slides`;
    const sizeStr = formatBytes(item.storage?.sizeBytes);
    return sizeStr ? `${typeLabel} • ${sizeStr}` : typeLabel;
  }

  if (item.fileType === 'spreadsheet') {
    if (metrics.sheetCount) return `${typeLabel} • ${metrics.sheetCount} sheets`;
    const sizeStr = formatBytes(item.storage?.sizeBytes);
    return sizeStr ? `${typeLabel} • ${sizeStr}` : typeLabel;
  }

  if (item.fileType === 'video' || item.fileType === 'audio') {
    if (metrics.durationSeconds) {
      const m = Math.floor(metrics.durationSeconds / 60);
      const s = Math.floor(metrics.durationSeconds % 60);
      if (m >= 60) {
        const h = Math.floor(m / 60);
        const remM = m % 60;
        return `${typeLabel} • ${h}h ${remM}m`;
      }
      return `${typeLabel} • ${m}m ${s}s`;
    }
    const sizeStr = formatBytes(item.storage?.sizeBytes);
    return sizeStr ? `${typeLabel} • ${sizeStr}` : typeLabel;
  }

  if (item.fileType === 'flashcards') {
    const count = metrics.cardCount ?? 0;
    return `${typeLabel} • ${count} cards`;
  }

  if (item.fileType === 'quiz') {
    const count = metrics.questionCount ?? 0;
    return `${typeLabel} • ${count} Qs`;
  }

  if (item.fileType === 'exam') {
    const pts = metrics.totalPoints ?? 100;
    return `${typeLabel} • ${pts} pts`;
  }

  if (item.fileType === 'note') {
    if (metrics.wordCount) return `${typeLabel} • ${metrics.wordCount} words`;
    return `${typeLabel} • Notes`;
  }

  if (item.storage?.sizeBytes) {
    return `${typeLabel} • ${formatBytes(item.storage.sizeBytes)}`;
  }

  return typeLabel;
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(isoStr?: string): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}
