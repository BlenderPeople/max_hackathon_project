import { Button, IconButton } from '@maxhub/max-ui';
import { Download, FileImage, FileText, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import type { OrderFile } from '../api/contracts';
import { api } from '../api/client';
import { formatDate, formatFileSize } from '../lib/format';
import { SectionHeader } from './SectionHeader';

type FileListProps = {
  files: OrderFile[];
  uploading: boolean;
  uploadError: boolean;
  onUpload: (file: File) => void;
};

export function FileList({ files, uploading, uploadError, onUpload }: FileListProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <section className="detail-section">
      <SectionHeader title="Файлы" trailing={<span className="section-count">{files.length}</span>} />
      <input ref={input} type="file" accept=".pdf,.jpg,.jpeg,.png,.txt" style={{ display: 'none' }} onChange={(event) => {
        const selected = event.target.files?.[0];
        if (selected) onUpload(selected);
        event.target.value = '';
      }} />
      <Button size="small" variant="secondary" iconBefore={<Upload size={17} />} loading={uploading} onClick={() => input.current?.click()}>Добавить файл</Button>
      {files.length === 0 && <p>Файлов пока нет.</p>}
      {(uploadError || downloadError) && <p className="action-error" role="alert">Не удалось обработать файл. Проверьте формат и размер (до 10 МБ).</p>}
      <ul className="file-list">
        {files.map((file) => {
          const FileIcon = file.content_type.startsWith('image/') ? FileImage : FileText;
          return (
            <li key={file.id}>
              <span className="file-icon"><FileIcon size={21} /></span>
              <div><strong>{file.filename}</strong><span>{formatFileSize(file.size)} · {formatDate(file.created_at)}</span></div>
              <IconButton
                size="small"
                variant="ghost"
                loading={downloading === file.id}
                aria-label={`Скачать ${file.filename}`}
                onClick={async () => {
                  setDownloading(file.id);
                  try { await api.downloadFile(file.id, file.filename); setDownloadError(false); }
                  catch { setDownloadError(true); }
                  finally { setDownloading(null); }
                }}
              ><Download size={19} /></IconButton>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
