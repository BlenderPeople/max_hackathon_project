import { Button } from '@maxhub/max-ui';
import { ImagePlus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useBusiness, useUpdateBusiness } from '../../api/hooks';
import { PageState } from '../../components/PageState';

export function ProfileEditScreen() {
  const query = useBusiness();
  const update = useUpdateBusiness();
  const navigate = useNavigate();
  if (query.isPending) return <PageState variant="loading" title="Открываем редактор" description="Загружаем данные профиля." />;
  if (query.isError) return <PageState variant="error" title="Профиль недоступен" description="Не удалось загрузить данные." />;
  return <ProfileEditor initial={query.data} loading={update.isPending} onSubmit={(input) => update.mutate(input, { onSuccess: () => navigate('/profile') })} />;
}

function ProfileEditor({ initial, loading, onSubmit }: { initial: Awaited<ReturnType<typeof useBusiness>>['data']; loading: boolean; onSubmit: (input: { specialization: string; experience: string; work_features: string; description: string; avatar_data_url: string | null }) => void }) {
  const [specialization, setSpecialization] = useState(initial?.specialization ?? '');
  const [experience, setExperience] = useState(initial?.experience ?? '');
  const [workFeatures, setWorkFeatures] = useState(initial?.work_features ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [avatar, setAvatar] = useState(initial?.avatar_url ?? null);
  const valid = specialization.trim() && experience.trim() && workFeatures.trim() && description.trim();
  return <div className="screen editor-screen"><header className="screen-heading"><div><p className="overline">Профиль мастера</p><h1>О себе</h1></div></header><form className="editor-form" onSubmit={(event) => { event.preventDefault(); if (valid) onSubmit({ specialization: specialization.trim(), experience: experience.trim(), work_features: workFeatures.trim(), description: description.trim(), avatar_data_url: avatar }); }}>
    <label className="avatar-upload"><div className="large-avatar">{avatar ? <img src={avatar} alt="" /> : <ImagePlus size={28} />}</div><div><strong>Аватар мастера</strong><span>JPG или PNG, можно заменить в любой момент.</span><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setAvatar(String(reader.result)); reader.readAsDataURL(file); }} /></div></label>
    <label className="form-field"><span>Специализация</span><input className="plain-input" value={specialization} maxLength={120} onChange={(event) => setSpecialization(event.target.value)} /></label>
    <label className="form-field"><span>Опыт</span><input className="plain-input" value={experience} maxLength={120} onChange={(event) => setExperience(event.target.value)} /></label>
    <label className="form-field"><span>Особенности работы</span><textarea className="plain-input plain-textarea" rows={4} maxLength={300} value={workFeatures} onChange={(event) => setWorkFeatures(event.target.value)} /></label>
    <label className="form-field"><span>Короткое описание</span><textarea className="plain-input plain-textarea" rows={4} maxLength={300} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
    <Button type="submit" size="large" stretched loading={loading} disabled={!valid}>Сохранить профиль</Button>
  </form></div>;
}
