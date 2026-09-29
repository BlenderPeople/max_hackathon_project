import { Button } from '@maxhub/max-ui';
import { ImagePlus } from 'lucide-react';
import { useState } from 'react';

import type { CreateServiceInput, ServiceDetails } from '../api/contracts';

function readImage(file: File, onRead: (value: string) => void) {
  const reader = new FileReader();
  reader.onload = () => onRead(String(reader.result));
  reader.readAsDataURL(file);
}

export function ServiceForm({ initial, loading, onSubmit }: { initial?: ServiceDetails; loading: boolean; onSubmit: (input: CreateServiceInput) => void }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState(initial?.price_from?.replace('.00', '') ?? '');
  const [duration, setDuration] = useState(String(initial?.duration_minutes ?? 60));
  const [image, setImage] = useState(initial?.image_url ?? null);
  const valid = title.trim().length >= 3 && description.trim().length >= 1 && price !== '' && Number(price) >= 0 && Number(duration) > 0;
  return <form className="editor-form" onSubmit={(event) => { event.preventDefault(); if (valid) onSubmit({ title: title.trim(), description: description.trim(), price_from: Number(price).toFixed(2), duration_minutes: Number(duration), image_data_url: image }); }}>
    <label className="form-field"><span>Фото услуги</span><div className="image-upload"><div className="image-preview">{image ? <img src={image} alt="" /> : <ImagePlus size={26} />}</div><div><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) readImage(file, setImage); }} /><small>Добавьте фото, чтобы услуга выделялась в каталоге.</small></div></div></label>
    <label className="form-field"><span>Название</span><input className="plain-input" value={title} maxLength={80} placeholder="Например, Обрезка деревьев" aria-describedby="title-hint" onChange={(event) => setTitle(event.target.value)} /><small id="title-hint">Минимум 3 символа</small></label>
    <label className="form-field"><span>Описание</span><textarea className="plain-input plain-textarea" rows={5} maxLength={4000} value={description} placeholder="Что входит в услугу и как вы работаете" aria-describedby="description-hint" onChange={(event) => setDescription(event.target.value)} /><small id="description-hint">Минимум 1 символ · {description.length}/4000</small></label>
    <div className="form-two-columns"><label className="form-field"><span>Цена от, ₽</span><input className="plain-input" type="number" min="0" step="100" value={price} aria-describedby="price-hint" onChange={(event) => setPrice(event.target.value)} /><small id="price-hint">Укажите цену (можно 0)</small></label><label className="form-field"><span>Длительность, минут</span><input className="plain-input" type="number" min="15" step="15" value={duration} onChange={(event) => setDuration(event.target.value)} /></label></div>
    <Button type="submit" size="large" stretched disabled={!valid} loading={loading}>{initial ? 'Сохранить услугу' : 'Добавить услугу'}</Button>
  </form>;
}
