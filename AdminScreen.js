import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const AdminScreen = () => {
    const [formulas, setFormulas] = useState([]);
    const [newFormula, setNewFormula] = useState({ title: '', description: '', latex: '', grade: 1 });

    useEffect(() => {
        fetchFormulas();
    }, []);

    const fetchFormulas = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('http://26.74.118.195:5000/formulas', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            setFormulas(data);
        } catch (error) {
            console.error('Error fetching formulas:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách công thức.');
        }
    };

    const handleAddFormula = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('http://26.74.118.195:5000/formulas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(newFormula),
            });

            if (response.ok) {
                Alert.alert('Thành công', 'Đã thêm công thức mới');
                setNewFormula({ title: '', description: '', latex: '', grade: 1 });
                fetchFormulas();
            } else {
                Alert.alert('Lỗi', 'Không thể thêm công thức');
            }
        } catch (error) {
            console.error('Error adding formula:', error);
            Alert.alert('Lỗi', 'Không thể thêm công thức');
        }
    };

    const handleDeleteFormula = async (id) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`http://26.74.118.195:5000/formulas/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                Alert.alert('Thành công', 'Đã xóa công thức');
                fetchFormulas();
            } else {
                Alert.alert('Lỗi', 'Không thể xóa công thức');
            }
        } catch (error) {
            console.error('Error deleting formula:', error);
            Alert.alert('Lỗi', 'Không thể xóa công thức');
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.formulaItem}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.latex}>{item.latex}</Text>
            <Text style={styles.gradeText}>Lớp: {item.grade}</Text>
            <Button title="Xóa" onPress={() => handleDeleteFormula(item._id)} color="#ff4081" />
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Quản lý công thức</Text>
            
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Tiêu đề"
                    value={newFormula.title}
                    onChangeText={(text) => setNewFormula({...newFormula, title: text})}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Mô tả"
                    value={newFormula.description}
                    onChangeText={(text) => setNewFormula({...newFormula, description: text})}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Công thức LaTeX"
                    value={newFormula.latex}
                    onChangeText={(text) => setNewFormula({...newFormula, latex: text})}
                />
                <Picker
                    selectedValue={newFormula.grade}
                    style={styles.input}
                    onValueChange={(itemValue) => setNewFormula({ ...newFormula, grade: itemValue })}
                >
                    {[...Array(12)].map((_, i) => (
                        <Picker.Item key={i+1} label={`Toán ${i+1}`} value={i+1} />
                    ))}
                </Picker>
                <Button title="Thêm công thức" onPress={handleAddFormula} color="#4CAF50" />
            </View>

            <FlatList
                data={formulas}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 20,
        padding: 16,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    input: {
        backgroundColor: '#fff',
        padding: 10,
        marginBottom: 10,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    list: {
        paddingBottom: 20,
    },
    formulaItem: {
        marginBottom: 12,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    title: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    description: {
        marginTop: 4,
        fontSize: 14,
    },
    latex: {
        marginTop: 4,
        fontStyle: 'italic',
        color: '#555',
    },
    gradeText: {
        marginTop: 4,
        color: '#008080',
        fontWeight: 'bold',
    },
});

export default AdminScreen; 