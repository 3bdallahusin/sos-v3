import React, { useState, useEffect } from 'react';
import { SharedPdfViewer } from './SharedPdfViewer.js';
import { Download, FileCode, CheckCircle, AlertTriangle } from 'lucide-react';

interface LearningDocxViewProps {
  fileId?: string;
}

export const LearningDocxView: React.FC<LearningDocxViewProps> = ({
  fileId = 'file-plasticity-docx'
}) => {
  const [fileData, setFileData] = useState<any>(null);
  const [activeSubTabIndex, setActiveSubTabIndex] = useState<number>(0);

  useEffect(() => {
    fetch(`/api/learning/files/${fileId}`)
      .then((res) => res.json())
      .then((data) => setFileData(data))
      .catch((err) => console.warn('[LearningDocxView] Failed to fetch file:', err));
  }, [fileId]);

  const pdfUrl = `/api/learning/files/${fileId}/view-pdf`;
  const originalFileName = fileData?.filename || 'Synaptic_Plasticity_Review.docx';
  const isReady = fileData?.status === 'ready';
  const isFailed = fileData?.status === 'failed';

  // Dynamic sections extracted from the actual DOCX OpenXML word/document.xml
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
  const sections: string[] = metadata?.sections || [];

  return (
    <div
      data-testid="learning-docx-view"
      className="flex-1 flex flex-col h-full w-full bg-[#080808] overflow-hidden"
    >
      {/* SHARED PDF VIEWER RENDERING THE DERIVED HIGH-FIDELITY PDF */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <SharedPdfViewer
          fileId={fileId}
          pdfUrl={pdfUrl}
          originalFileName={originalFileName}
          fileType="docx"
          aspectRatio="a4"
          subTabs={sections.length > 0 ? sections : undefined}
          activeSubTabIndex={activeSubTabIndex}
          onSubTabClick={setActiveSubTabIndex}
        />
      </div>
    </div>
  );
};
