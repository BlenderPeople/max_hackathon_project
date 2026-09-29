import { Button } from '@maxhub/max-ui';
import { Send } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useConversation, useSendMessage } from '../../api/hooks';
import { PageState } from '../../components/PageState';

export function ChatScreen() {
  const { publicToken = '' } = useParams();
  const query = useConversation(publicToken);
  const send = useSendMessage(publicToken);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [query.data?.messages.length]);
  if (query.isPending) return <PageState variant="loading" title="Открываем чат" description="Загружаем историю сообщений." />;
  if (query.isError) return <PageState variant="error" title="Чат не открылся" description="У вас нет доступа к этому диалогу или он был удалён." />;
  const chat = query.data;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const message = text.trim();
    if (!message || send.isPending) return;
    send.mutate(message, { onSuccess: () => setText('') });
  };
  return (
    <section className="chat-screen">
      <header className="chat-heading"><strong>{chat.peer_name}</strong><span>{chat.service_title} · {chat.business_name}</span></header>
      <div className="message-list" aria-live="polite">
        {!chat.messages.length && <p className="chat-empty">Диалог создан. Напишите первое сообщение.</p>}
        {chat.messages.map((message) => <article key={message.public_token} className={`message-bubble${message.is_mine ? ' is-mine' : ''}`}>
          {!message.is_mine && <strong>{message.author_name}</strong>}
          <p>{message.text}</p>
          <time>{new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(message.created_at))}</time>
        </article>)}
        <div ref={endRef} />
      </div>
      <form className="chat-composer" onSubmit={submit}>
        <textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={4000} rows={1} placeholder="Сообщение" aria-label="Сообщение" />
        <Button type="submit" size="medium" variant="primary" loading={send.isPending} disabled={!text.trim()} aria-label="Отправить"><Send size={20} /></Button>
      </form>
      {send.isError && <p className="chat-send-error" role="alert">Сообщение не отправилось. Попробуйте ещё раз.</p>}
    </section>
  );
}
