import React, { useState } from 'react';
import { X, Archive, Download, Upload, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useLibraryStore } from '../../stores/library-store.js';
import { exportSosBackup, validateAndRestoreSosBackup } from '@sos/persistence';

export const BackupModal: React.FC = () => {
  const {
    isBackupModalOpen,
    closeBackupModal,
    loadLibraryData
  } = useLibraryStore();

  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<{ filename: string; checksum: string } | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (!isBackupModalOpen) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportSuccess(null);
      const { blob, filename, checksum } = await exportSosBackup();

      // Trigger browser file download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccess({ filename, checksum });
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsRestoring(true);
      setRestoreStatus(null);
      const arrayBuffer = await file.arrayBuffer();
      const result = await validateAndRestoreSosBackup(arrayBuffer);

      if (result.success) {
        setRestoreStatus({
          success: true,
          message: `Successfully restored ${result.restoredFolders} folders and ${result.restoredItems} learning resources!`
        });
        await loadLibraryData();
      } else {
        setRestoreStatus({
          success: false,
          message: result.error || 'Failed to restore backup archive'
        });
      }
    } catch (err: unknown) {
      setRestoreStatus({
        success: false,
        message: err instanceof Error ? err.message : 'Unknown restore error'
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none"
      onClick={closeBackupModal}
    >
      <div
        className="w-full max-w-lg rounded-[16px] bg-[#0E0E11] border border-[#27272A] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        data-testid="backup-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F1F23]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-[8px] bg-[#18181B] border border-[#27272A]">
              <Archive className="w-4 h-4 text-[#E4E4E7]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Data Portability & Disaster Recovery
              </h2>
              <p className="text-[11px] text-[#A1A1AA]">
                Local-first portable `.sos` backup archive with SHA-256 verification
              </p>
            </div>
          </div>
          <button
            onClick={closeBackupModal}
            className="p-1 text-[#71717A] hover:text-white rounded-[6px] hover:bg-[#18181B] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-5">
          {/* Export Box */}
          <div className="p-4 rounded-[12px] bg-[#141417] border border-[#27272A]">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-xs font-semibold text-white tracking-tight flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span>Export Full Library Backup</span>
                </h3>
                <p className="text-[11px] text-[#A1A1AA] mt-1 leading-relaxed">
                  Packages all folders, documents, metadata, and manifest into a single `.sos` archive file.
                </p>
              </div>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="h-[32px] px-3.5 flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-[#E4E4E7] text-black rounded-[8px] transition-colors shrink-0 disabled:opacity-50"
                data-testid="export-backup-btn"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Exporting...' : 'Export .sos'}</span>
              </button>
            </div>

            {exportSuccess && (
              <div className="p-2.5 rounded-[8px] bg-[#18181B] border border-[#27272A] text-[10px] font-mono text-[#A1A1AA] flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[#10B981] font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Archive created: {exportSuccess.filename}</span>
                </div>
                <div className="text-[#71717A] truncate">
                  SHA-256: {exportSuccess.checksum}
                </div>
              </div>
            )}
          </div>

          {/* Restore Box */}
          <div className="p-4 rounded-[12px] bg-[#141417] border border-[#27272A]">
            <div className="mb-3">
              <h3 className="text-xs font-semibold text-white tracking-tight flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-[#A1A1AA]" />
                <span>Restore from .sos Backup</span>
              </h3>
              <p className="text-[11px] text-[#A1A1AA] mt-1 leading-relaxed">
                Upload a `.sos` archive. The SHA-256 integrity checksum will be verified before applying any changes.
              </p>
            </div>

            <label className="flex items-center justify-center gap-2 h-[36px] px-4 rounded-[8px] border border-dashed border-[#3F3F46] hover:border-[#71717A] bg-[#18181B] text-xs font-medium text-[#E4E4E7] hover:text-white cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>{isRestoring ? 'Verifying & Restoring...' : 'Select .sos Archive to Restore'}</span>
              <input
                type="file"
                accept=".sos,.zip"
                onChange={handleFileChange}
                disabled={isRestoring}
                className="hidden"
                data-testid="restore-file-input"
              />
            </label>

            {restoreStatus && (
              <div
                className={`mt-3 p-3 rounded-[8px] border text-xs flex items-start gap-2 ${
                  restoreStatus.success
                    ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                    : 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
                }`}
                data-testid="restore-status-message"
              >
                {restoreStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{restoreStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1F1F23] flex justify-end">
          <button
            onClick={closeBackupModal}
            className="h-[32px] px-4 text-xs text-[#A1A1AA] hover:text-white hover:bg-[#18181B] rounded-[8px] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
