// src/components/NotificationToast.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NotificationMessage } from '../utils/notifications';

interface NotificationToastProps {
  notification: NotificationMessage | null;
  onClose: () => void;
  onAction?: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onAction,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      
      // Auto-close se tiver duração definida
      if (notification.duration) {
        const timer = setTimeout(() => {
          handleClose();
        }, notification.duration);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [notification]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleAction = () => {
    if (notification?.action?.onPress) {
      notification.action.onPress();
    }
    if (onAction) {
      onAction();
    }
    handleClose();
  };

  if (!notification || !isVisible) return null;

  const getIconName = () => {
    switch (notification.type) {
      case 'success':
        return 'checkmark-circle';
      case 'info':
        return 'information-circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'close-circle';
      default:
        return 'information-circle';
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return '#4CAF50';
      case 'info':
        return '#2196F3';
      case 'warning':
        return '#FF9800';
      case 'error':
        return '#F44336';
      default:
        return '#2196F3';
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getIconName() as any}
            size={24}
            color="white"
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.message}>{notification.message}</Text>
        </View>

        <View style={styles.actions}>
          {notification.action && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleAction}
            >
              <Text style={styles.actionText}>
                {notification.action.label}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
});
