import { Button } from '@maxhub/max-ui';
import { ArrowRight, Clock3, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { ServiceDetails } from '../api/contracts';
import { formatMoney } from '../lib/format';

export function ServiceCard({ service, detailed = false }: { service: ServiceDetails; detailed?: boolean }) {
  return (
    <article className={detailed ? 'service-detail' : 'service-card'}>
      {service.image_url && (
        <figure className="service-media">
          <img src={service.image_url} alt="Арборист выполняет обрезку дерева" />
          {detailed && (
            <figcaption>
              Фото: TreeMinion15, <a href="https://creativecommons.org/licenses/by-sa/4.0" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>
            </figcaption>
          )}
        </figure>
      )}
      <div className="service-copy">
        <div className="service-title-row">
          <div>
            <p className="overline">{service.business_name}</p>
            <h2>{service.title}</h2>
          </div>
          <strong className="service-price">от {formatMoney(service.price_from)}</strong>
        </div>
        <p className={detailed ? 'service-description' : 'line-clamp'}>{service.description}</p>
        <div className="service-meta">
          <span><Clock3 size={16} />{service.duration}</span>
          <span><Star size={16} fill="currentColor" />{service.business.rating.toFixed(1)}</span>
        </div>
        {!detailed && (
          <Button asChild variant="secondary" size="small" stretched iconAfter={<ArrowRight size={18} />}>
            <Link to={`/services/${service.public_token}`}>Подробнее</Link>
          </Button>
        )}
      </div>
    </article>
  );
}
