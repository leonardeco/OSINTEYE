const STORAGE_KEY = 'osinteye_notifications_enabled';

export function useNotifications() {
  const enabled =
    localStorage.getItem(STORAGE_KEY) === 'true' &&
    typeof Notification !== 'undefined' &&
    Notification.permission === 'granted';

  const requestPermission = async (): Promise<void> => {
    if (typeof Notification === 'undefined') return;
    await Notification.requestPermission();
  };

  const notify = (title: string, body: string): void => {
    if (!enabled) return;
    new Notification(title, { body });
  };

  return { enabled, requestPermission, notify };
}
