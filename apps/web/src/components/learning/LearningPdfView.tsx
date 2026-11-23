import React, { useState, useEffect, useRef } from 'react';
import { SharedPdfViewer } from './SharedPdfViewer.js';

interface LearningPdfViewProps {
  fileId?: string;
}

export const LearningPdfView: React.FC<LearningPdfViewProps> = ({
  fileId = 'file-kandel-pdf'
}) => {
  const [fileData, setFileData] = useState<any>(null);
  const thumbnailCanvasesRef = useRef<Map<number, HTMLCanvasElement>>(new Map());

  useEffect(() => {
    fetch(`/api/learning/files/${fileId}`)
      .then(async (res) => {
        if (!res.ok) {
          const libRes = await fetch(`/api/library/items/${fileId}`);
          if (libRes.ok) return libRes.json();
          throw new Error('Not found');
        }
        return res.json();
      })
      .then((data) => setFileData(data))
      .catch((err) => console.warn('[LearningPdfView] Failed to fetch file:', err));
  }, [fileId]);

  const pdfUrl = fileData?.storage?.url || `/api/learning/files/${fileId}/view-pdf`;
  const originalFileName =
    fileData?.filename ||
    fileData?.name ||
    (fileId === 'file-kandel-pdf' ? 'Kandel_Principles_Ch12.pdf' : 'Document.pdf');

  return (
    <div
      data-testid="learning-pdf-view"
      className="flex-1 flex h-full w-full bg-[#080808] overflow-hidden relative"
    >
      <SharedPdfViewer
        fileId={fileId}
        pdfUrl={pdfUrl}
        originalFileName={originalFileName}
        fileType="pdf"
        aspectRatio="a4"
      />
    </div>
  );
};
