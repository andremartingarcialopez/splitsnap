import { Link, useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { PageHeader } from '../components/PageHeader';
import { useHistory } from '../hooks/useHistory';

function money(n: number | null | undefined) {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(n);
}

export function HistoryPage() {
  const navigate = useNavigate();
  const { items, status, error, reload } = useHistory();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historial"
        subtitle="Tickets finalizados con resumen de división."
      />

      {status === 'loading' && <LoadingState label="Cargando historial…" />}

      {status === 'error' && (
        <ErrorState message={error || 'Error desconocido'} onRetry={() => void reload()} />
      )}

      {status === 'ready' && items.length === 0 && (
        <EmptyState
          title="Sin tickets finalizados"
          description="Cuando finalices un ticket desde su detalle, aparecerá aquí con el resumen de la división."
          actionLabel="Ver tickets activos"
          onAction={() => navigate('/tickets')}
        />
      )}

      {status === 'ready' && items.length > 0 && (
        <>
          <div className="card hidden overflow-hidden p-0 md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-neutral/80 text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Restaurante</th>
                  <th className="px-4 py-3 font-medium">Finalizado</th>
                  <th className="px-4 py-3 font-medium">Participantes</th>
                  <th className="px-4 py-3 font-medium">Total impreso</th>
                  <th className="px-4 py-3 font-medium">Total calculado</th>
                  <th className="px-4 py-3 text-right font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">
                      {item.restaurantName || item.title}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(item.finalizedAt).toLocaleString('es-MX')}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {item.participantCount} ·{' '}
                      {item.participantNames.length > 0
                        ? item.participantNames.join(', ')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">{money(item.total)}</td>
                    <td className="px-4 py-3 font-medium text-primary">
                      {money(item.grandTotal)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/history/${item.id}`}
                        className="btn-secondary touch-target inline-flex px-3 text-xs"
                      >
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {items.map((item) => (
              <article key={item.id} className="card space-y-3">
                <div>
                  <h2 className="font-medium">{item.restaurantName || item.title}</h2>
                  <p className="text-xs text-muted">
                    {new Date(item.finalizedAt).toLocaleString('es-MX')}
                  </p>
                </div>
                <p className="text-sm text-muted">
                  {item.participantCount} participantes · {item.productCount} productos
                </p>
                <p className="text-sm">
                  Calculado{' '}
                  <span className="font-medium text-primary">{money(item.grandTotal)}</span>
                </p>
                <Link
                  to={`/history/${item.id}`}
                  className="btn-secondary touch-target block text-center text-xs"
                >
                  Ver detalle
                </Link>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
