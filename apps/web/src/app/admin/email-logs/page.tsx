'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { adminApi } from '@/lib/admin-api';

interface EmailLog {
  id: string;
  to: string;
  user?: { firstName: string; lastName: string };
  template: string;
  status: string;
  createdAt: string;
  orderId?: string;
}

export default function EmailLogsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'email-logs'],
    queryFn: () => adminApi.emails.list(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-brand-ink">Journal des e-mails</h1>
      </div>

      <div className="overflow-hidden rounded-xl border border-brand-gold/10 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-brand-gold/10 bg-brand-ivory/50 text-xs uppercase tracking-wider text-brand-ink/50">
            <tr>
              <th className="px-6 py-4 font-medium">Destinataire</th>
              <th className="px-6 py-4 font-medium">Template</th>
              <th className="px-6 py-4 font-medium">Statut</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-gold/5">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-4">
                    <div className="h-4 w-full rounded bg-brand-gold/5" />
                  </td>
                </tr>
              ))
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-brand-ink/50">
                  Aucun e-mail envoyé.
                </td>
              </tr>
            ) : (
              (data?.items as EmailLog[] | undefined)?.map((log) => (
                <tr key={log.id} className="hover:bg-brand-ivory/20">
                  <td className="px-6 py-4">
                    <div className="font-medium text-brand-ink">{log.to}</div>
                    {log.user && (
                      <div className="text-xs text-brand-ink/50">
                        {log.user.firstName} {log.user.lastName}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <code className="rounded bg-brand-gold/5 px-2 py-0.5 text-xs text-brand-gold">
                      {log.template}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        log.status === 'SENT'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {log.status === 'SENT' ? 'Envoyé' : 'Échec'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-brand-ink/60">
                    {format(new Date(log.createdAt), 'PPp', { locale: fr })}
                  </td>
                  <td className="px-6 py-4 text-xs text-brand-ink/40">
                    {log.orderId && `Commande: ${log.orderId.slice(-8).toUpperCase()}`}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
