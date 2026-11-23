import JSZip from 'jszip';
import { ALL_PROJECT_FILES, type ExportProjectFile } from '../data/projectFiles';

export async function downloadProjectZip(
  files: ExportProjectFile[] = ALL_PROJECT_FILES,
  zipFilename = 'tvet-eassess-project.zip',
): Promise<{ fileCount: number; byteSize: number }> {
  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.path, file.content);
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return {
    fileCount: files.length,
    byteSize: blob.size,
  };
}
