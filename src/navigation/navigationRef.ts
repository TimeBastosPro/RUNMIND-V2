import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export function resetToCoachMain(): void {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name: 'CoachMain' }] });
  }
}

