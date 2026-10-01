import type { ChangeEvent } from 'react';
import { AdminImage, adminControl, adminInput } from './AdminUI';
export default function AdminProductImage({ preview, onChange, onRemove }: { preview: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void; onRemove: () => void }) {
  return <div className="space-y-4">
    {preview ? <AdminImage src={preview} alt="상품 대표 이미지 미리보기" className="aspect-square w-full rounded-xl border border-brand-border object-contain" /> : <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-brand-border bg-stone-50 text-sm text-brand-muted">이미지를 선택해 주세요.</div>}
    <label className="block text-sm font-medium">대표 이미지 선택<input className={`${adminInput} file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2`} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={onChange} /></label>
    <p className="text-xs text-brand-muted">JPG · PNG · GIF · WEBP · 최대 5MB</p>
    {preview && <button type="button" className={adminControl} onClick={onRemove}>선택 이미지 취소</button>}
  </div>;
}
