import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import TopNavbar from '../components/TopNavbar';
import { getCurrentUserRestaurantId } from '../services/database';
import {
  getAssistanceRequestsByRestaurant,
  updateAssistanceRequest,
  subscribeToAssistanceRequests,
  type AssistanceRequest,
} from '../services/api';

function formatTimeAgo(dateStr: string, t: (key: string) => string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const sec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (sec < 60) return t('waiter.assistance.justNow') || 'Ahora mismo';
  const min = Math.floor(sec / 60);
  if (min < 60) return t('waiter.assistance.minutesAgo')?.replace('{{count}}', String(min)) || `Hace ${min} min`;
  const h = Math.floor(min / 60);
  return t('waiter.assistance.hoursAgo')?.replace('{{count}}', String(h)) || `Hace ${h} h`;
}

const WaiterAssistanceRequestsScreen: React.FC = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const loadRequests = useCallback(async (restId: string) => {
    setLoading(true);
    const result = await getAssistanceRequestsByRestaurant(restId, { status: 'pending' });
    if (result.success && result.data) {
      setRequests(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const restId = await getCurrentUserRestaurantId();
      if (!mounted || !restId) {
        setLoading(false);
        return;
      }
      setRestaurantId(restId);
      await loadRequests(restId);
    })();
    return () => {
      mounted = false;
    };
  }, [loadRequests]);

  useEffect(() => {
    if (!restaurantId) return;
    const unsubscribe = subscribeToAssistanceRequests(restaurantId, (payload) => {
      setRequests((prev) => [payload.new, ...prev]);
      setNotification({
        message: t('waiter.assistance.newRequest') || 'Nueva solicitud de asistencia',
        visible: true,
      });
      setTimeout(() => setNotification((n) => ({ ...n, visible: false })), 3000);
    });
    return unsubscribe;
  }, [restaurantId, t]);

  const handleMarkAttended = async (id: string) => {
    const result = await updateAssistanceRequest(id, { status: 'attended' });
    if (result.success) {
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full max-w-[480px] mx-auto flex-col overflow-x-hidden pb-24 bg-background-light dark:bg-background-dark">
      <TopNavbar showAvatar={true} showWelcome={true} showBackButton={false} />
      <div className="px-4 pt-6">
        <h1 className="text-xl font-bold text-[#181411] dark:text-white mb-2">
          {t('waiter.home.assistanceRequests')}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {t('waiter.home.assistanceRequestsDescription')}
        </p>

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#32281d] p-8 text-center">
            <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-3">
              support_agent
            </span>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('waiter.assistance.noRequests') || 'No hay solicitudes de asistencia en este momento.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#32281d] p-4 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#181411] dark:text-white">
                    {req.message || req.request_type}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {req.table_number && (
                      <span>{t('waiter.tables.tableLabel').replace('{{number}}', String(req.table_number))}</span>
                    )}
                    <span>{formatTimeAgo(req.created_at, t)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleMarkAttended(req.id)}
                  className="shrink-0 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium"
                >
                  {t('waiter.assistance.markAttended') || 'Atendido'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast notificación nueva solicitud */}
      {notification.visible && (
        <div
          className="fixed bottom-24 left-4 right-4 max-w-[480px] mx-auto z-50 px-4 py-3 rounded-xl bg-primary text-white shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}
    </div>
  );
};

export default WaiterAssistanceRequestsScreen;
