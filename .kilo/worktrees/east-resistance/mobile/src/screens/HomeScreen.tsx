import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppStack';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { LogOut, PlusCircle } from 'lucide-react-native';

type Props = NativeStackScreenProps<AppStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchSelectedTasks();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchSelectedTasks = async () => {
    try {
      const res = await apiClient.get('/tasks/selected');
      setTasks(res.data.tasks);
    } catch (error) {
      Alert.alert('Error', 'Could not load your tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout }
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1E40AF" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Services</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>

      {tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You haven't selected any tasks yet.</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.categoryBadge}>{item.category.name}</Text>
              <Text style={styles.taskName}>{item.name}</Text>
              <Text style={styles.taskDesc}>{item.description}</Text>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('TaskSelection')}>
        <PlusCircle color="#fff" size={24} style={{ marginRight: 8 }} />
        <Text style={styles.fabText}>Manage Tasks</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  logoutBtn: { padding: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#666' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  categoryBadge: { color: '#1E40AF', fontSize: 12, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  taskName: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  taskDesc: { fontSize: 14, color: '#666', lineHeight: 20 },
  fab: { position: 'absolute', bottom: 32, alignSelf: 'center', flexDirection: 'row', backgroundColor: '#1E40AF', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 30, shadowColor: '#1E40AF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  fabText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});