// src/stores/notifications.ts

import { create } from 'zustand';
import type { NotificationMessage } from '../utils/notifications';

interface NotificationsState {
  currentNotification: NotificationMessage | null;
  
  // Actions
  showNotification: (notification: NotificationMessage) => void;
  hideNotification: () => void;
  clearNotifications: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  currentNotification: null,

  showNotification: (notification: NotificationMessage) => {
    set({
      currentNotification: notification
    });
  },

  hideNotification: () => {
    set({
      currentNotification: null
    });
  },

  clearNotifications: () => {
    set({
      currentNotification: null
    });
  }
}));
