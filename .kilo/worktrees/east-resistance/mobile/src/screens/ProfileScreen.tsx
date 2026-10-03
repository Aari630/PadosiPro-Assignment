import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppStack';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

type Props = NativeStackScreenProps<AppStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation, route }: Props) {
  const { isFirstTime } = route.params;
  const setHasProfile = useAuthStore((state) => state.setHasProfile);
  
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!fullName || !mobileNumber || !address) {
      Alert.alert('Required Fields', 'Name, Mobile, and Address are mandatory.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/profile', { fullName, mobileNumber, address, businessName });
      setHasProfile(true);
      
      if (isFirstTime) {
        navigation.replace('TaskSelection');
      } else {
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Could not save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
      <Text style={styles.title}>{isFirstTime ? 'Complete Profile' : 'Edit Profile'}</Text>
      <Text style={styles.subtitle}>Tell us about yourself to get started.</Text>

      <Text style={styles.label}>Full Name *</Text>
      <TextInput style={styles.input} placeholder="John Doe" value={fullName} onChangeText={setFullName} />

      <Text style={styles.label}>Mobile Number (+91) *</Text>
      <TextInput style={styles.input} placeholder="9876543210" keyboardType="phone-pad" maxLength={10} value={mobileNumber} onChangeText={setMobileNumber} />

      <Text style={styles.label}>Address *</Text>
      <TextInput style={[styles.input, styles.textArea]} placeholder="Full home or office address" multiline numberOfLines={3} value={address} onChangeText={setAddress} />

      <Text style={styles.label}>Business Name (Optional)</Text>
      <TextInput style={styles.input} placeholder="Company Name Ltd." value={businessName} onChangeText={setBusinessName} />

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save & Continue</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#111', marginTop: 40, marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 16, height: 52, backgroundColor: '#f9f9f9', marginBottom: 20, fontSize: 16 },
  textArea: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
  button: { backgroundColor: '#1E40AF', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' }
});