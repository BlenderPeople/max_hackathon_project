import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useConversations } from '../../api/hooks';
import { PageState } from '../../components/PageState';

export function ChatsScreen() {
  const query = useConversations();
  if (query.isPending) return <PageState variant="loading" title="Загружаем чаты" description="Получаем ваши диалоги с клиентами и мастерами." />;
  if (query.isError) return <PageState variant="error" title="Не удалось загрузить чаты" description="Проверьте соединение и попробуйте ещё раз." />;
  if (!query.data.length) return <PageState variant="empty" title="Чатов пока нет" description="Откройте услугу и нажмите «Обсудить», чтобы начать диалог с мастером." />;
  return (
    <section className="chats-screen">
      <header className="screen-heading"><div><h1>Чаты</h1><p>Обсуждение услуг внутри приложения</p></div></header>
      <div className="chat-list">
        {query.data.map((chat) => {
          const last = chat.messages.at(-1);
          return <Link key={chat.public_token} to={`/chats/${chat.public_token}`} className="chat-row">
            <span className="chat-avatar"><MessageCircle size={22} /></span>
            <span className="chat-row-copy"><strong>{chat.peer_name}</strong><small>{chat.service_title}</small><span>{last?.text ?? 'Диалог создан — напишите первое сообщение'}</span></span>
            <time>{new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date(chat.updated_at))}</time>
          </Link>;
        })}
      </div>
    </section>
  );
}
