import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SectionList, ActivityIndicator, Alert, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppStack';
import { apiClient } from '../api/client';
import { CheckCircle2, Circle, Search } from 'lucide-react-native';

type Props = NativeStackScreenProps<AppStackParamList, 'TaskSelection'>;

export default function TaskSelectionScreen({ navigation }: Props) {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
  try {
    // 1. Fetch the catalog (Critical)
    const catalogRes = await apiClient.get('/tasks/catalog');
    const formatted = catalogRes.data.categories.map((c: any) => ({
      title: c.name,
      data: c.tasks,
    }));
    setCatalog(formatted);

    // 2. Fetch existing selections (Non-critical, wrap in its own try/catch)
    try {
      const selectedRes = await apiClient.get('/tasks/selected');
      if (selectedRes.data.tasks) {
        const existingIds = selectedRes.data.tasks.map((t: any) => t.id);
        setSelectedIds(new Set(existingIds));
      }
    } catch (err) {
      console.warn('Could not load existing selections');
    }
  } catch (error) {
    Alert.alert('Error', 'Could not load task catalog');
  } finally {
    setLoading(false);
  }
};

  const toggleTask = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0) {
      Alert.alert('Selection Required', 'Please select at least one task.');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/tasks/select', { taskIds: Array.from(selectedIds) });
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Error', 'Could not save selections');
    } finally {
      setSaving(false);
    }
  };

  // Local search filtering
  const filteredCatalog = useMemo(() => {
    if (!searchQuery) return catalog;
    const lowerQ = searchQuery.toLowerCase();
    return catalog.map(section => ({
      ...section,
      data: section.data.filter((task: any) => task.name.toLowerCase().includes(lowerQ) || task.description.toLowerCase().includes(lowerQ))
    })).filter(section => section.data.length > 0);
  }, [catalog, searchQuery]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1E40AF" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What do you need help with?</Text>
      
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search tasks..." 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredCatalog.length === 0 ? (
        <View style={styles.center}><Text style={styles.emptyText}>No tasks found.</Text></View>
      ) : (
        <SectionList
          sections={filteredCatalog}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          renderItem={({ item }) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <TouchableOpacity style={[styles.taskCard, isSelected && styles.taskCardSelected]} onPress={() => toggleTask(item.id)}>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskName}>{item.name}</Text>
                  <Text style={styles.taskDesc}>{item.description}</Text>
                </View>
                {isSelected ? <CheckCircle2 color="#1E40AF" size={24} /> : <Circle color="#ccc" size={24} />}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleConfirm} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirm Selections ({selectedIds.size})</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111', paddingHorizontal: 24, marginBottom: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', marginHorizontal: 24, borderRadius: 12, paddingHorizontal: 12, height: 48, marginBottom: 16 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 12, color: '#1E40AF' },
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 16, marginHorizontal: 24, marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  taskCardSelected: { borderColor: '#1E40AF', backgroundColor: '#EFF6FF' },
  taskInfo: { flex: 1, marginRight: 16 },
  taskName: { fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 4 },
  taskDesc: { fontSize: 13, color: '#666' },
  emptyText: { fontSize: 16, color: '#999' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  button: { backgroundColor: '#1E40AF', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' }
});