import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

type Props = NativeStackScreenProps<RootStackParamList, 'OTP'>;

export default function OtpScreen({ route }: Props) {
  const { email } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/verify-otp', { email, otp });
      // On success, save token to global store - this will automatically navigate to AppStack
      await login(response.data.token, response.data.user);
    } catch (error: any) {
      Alert.alert('Verification Failed', error.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await apiClient.post('/auth/resend-otp', { email });
      setResendTimer(30);
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Could not resend code');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Email</Text>
      <Text style={styles.subtitle}>We sent a 6-digit code to {email}</Text>

      <TextInput
        style={styles.otpInput}
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
        textAlign="center"
      />

      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.resendButton, resendTimer > 0 && styles.resendDisabled]} 
        onPress={handleResend}
        disabled={resendTimer > 0}
      >
        <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
          {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 32 },
  otpInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, height: 64, fontSize: 32, letterSpacing: 8, backgroundColor: '#f9f9f9', marginBottom: 24 },
  button: { backgroundColor: '#1E40AF', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  resendButton: { marginTop: 24, alignItems: 'center', padding: 12 },
  resendDisabled: { opacity: 0.5 },
  resendText: { color: '#1E40AF', fontSize: 16, fontWeight: '600' },
  resendTextDisabled: { color: '#999' }
});