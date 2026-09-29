import { Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useSearchBusinesses } from '../api/hooks';

export function SearchMasters() {
  const [query, setQuery] = useState('');
  const search = useSearchBusinesses(query);

  return (
    <div className="search-masters">
      <div className="search-input-wrapper" style={{ display: 'flex', alignItems: 'center', background: 'var(--border)', borderRadius: '12px', padding: '8px 12px', marginBottom: '16px' }}>
        <Search size={18} color="var(--muted)" style={{ marginRight: '8px' }} />
        <input 
          type="text" 
          placeholder="Найти мастера по @username или имени" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '15px' }}
        />
      </div>
      
      {query.length > 0 && search.data && (
        <div className="search-results" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {search.data.length === 0 ? (
            <p className="muted-copy" style={{ textAlign: 'center' }}>Мастера не найдены</p>
          ) : (
            search.data.map(master => (
              <Link key={master.public_token} to={`/master/${master.public_token}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--surface)', borderRadius: '12px', textDecoration: 'none', color: 'inherit', border: '1px solid var(--border)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--border)', overflow: 'hidden' }}>
                  {master.avatar_url && <img src={master.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '15px' }}>{master.name}</strong>
                  <span style={{ display: 'block', fontSize: '13px', color: 'var(--muted)' }}>{master.specialization || 'Мастер'}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
