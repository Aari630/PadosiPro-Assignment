import AppStack from './AppStack';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';

// We will build the App screens in the next milestone
import { View, Text, Button } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OtpScreen from '../screens/OtpScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  OTP: { email: string };
  AppStack: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();


export default function AppNavigator() {
  const { user } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Auth Stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="OTP" component={OtpScreen} />
        </>
      ) : (
        // App Stack (Protected)
        <Stack.Screen name="AppStack" component={AppStack} />
      )}
    </Stack.Navigator>
  );
}