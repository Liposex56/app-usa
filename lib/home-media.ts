/** Public bucket (see 0003_storage.sql) holding each Havener's "meet my home" media. */
export const HOME_MEDIA_BUCKET = 'sitter-photos';

const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'webm', 'm4v']);

export function homeMediaKind(fileName: string): 'photo' | 'video' {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  return VIDEO_EXTENSIONS.has(extension) ? 'video' : 'photo';
}
