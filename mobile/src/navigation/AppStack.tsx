import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';

import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TaskSelectionScreen from '../screens/TaskSelectionScreen';

export type AppStackParamList = {
  Home: undefined;
  Profile: { isFirstTime: boolean };
  TaskSelection: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  const { user } = useAuthStore();
  
  // Force users without a profile to the Profile screen first
  const initialRoute = user?.hasProfile ? 'Home' : 'Profile';

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        initialParams={{ isFirstTime: !user?.hasProfile }}
        options={{ gestureEnabled: user?.hasProfile }} 
      />
      <Stack.Screen name="TaskSelection" component={TaskSelectionScreen} />
    </Stack.Navigator>
  );
}