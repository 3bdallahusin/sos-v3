import React, { useState, useEffect } from 'react';
import { SharedPdfViewer } from './SharedPdfViewer.js';
import { Presentation, Play, Download, MessageSquare, AlertTriangle } from 'lucide-react';

interface LearningSlidesViewProps {
  fileId?: string;
}

export const LearningSlidesView: React.FC<LearningSlidesViewProps> = ({
  fileId = 'file-neuro-slides-pptx'
}) => {
  const [fileData, setFileData] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState<number>(1);
  const [totalSlides, setTotalSlides] = useState<number>(6);

  useEffect(() => {
    fetch(`/api/learning/files/${fileId}`)
      .then((res) => res.json())
      .then((data) => {
        setFileData(data);
        if (data.pageCount) setTotalSlides(data.pageCount);
      })
      .catch((err) => console.warn('[LearningSlidesView] Failed to fetch file:', err));
  }, [fileId]);

  const pdfUrl = `/api/learning/files/${fileId}/view-pdf`;
  const originalFileName = fileData?.filename || 'Neurobiology_Lecture_04.pptx';
  const isFailed = fileData?.status === 'failed';

  // Dynamic presenter notes extracted from PPTX OpenXML ppt/notesSlides/notesSlide*.xml
  const rawMeta = fileData?.metadata;
  let metadata: any = {};
  if (typeof rawMeta === 'string') {
    try {
      metadata = JSON.parse(rawMeta);
    } catch {
      metadata = {};
    }
  } else if (rawMeta && typeof rawMeta === 'object') {
    metadata = rawMeta;
  }
  const speakerNotes: Record<number, string> = metadata?.speakerNotes || {};

  return (
    <div
      data-testid="learning-slides-view"
      className="flex-1 flex flex-col h-full w-full bg-[#080808] overflow-hidden"
    >
      {/* SHARED PDF VIEWER IN 16:9 PRESENTATION MODE */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <SharedPdfViewer
          fileId={fileId}
          pdfUrl={pdfUrl}
          originalFileName={originalFileName}
          fileType="slides"
          aspectRatio="16:9"
          speakerNotes={speakerNotes}
          onPageChange={(page, total) => {
            setCurrentSlide(page);
            setTotalSlides(total);
          }}
        />
      </div>
    </div>
  );
};
