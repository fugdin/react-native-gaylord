import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

// Color theme to match HomeScreen
const COLORS = {
    primary: '#86bc4b',      // Medium green for elements
    primaryDark: '#4a8522',  // Darker green for active elements
    textDark: '#2a4d16',     // Very dark green for text
    accent: '#ffffff',       // White for contrast
    background: '#f8f9fa'    // Light background
};

const FavoriteFormulasScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            
            if (!token) {
                Alert.alert(t('error'), t('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'));
                navigation.goBack();
                return;
            }
            
            const response = await fetch('http://26.74.118.195:5000/users/favorites', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                Alert.alert(t('error'), data.message || t('Không thể tải công thức yêu thích.'));
                return;
            }
            
            setFavorites(data);
        } catch (error) {
            console.error('Error fetching favorite formulas:', error);
            Alert.alert(t('error'), t('Không thể tải công thức yêu thích. Vui lòng thử lại sau.'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchFavorites();
    };

    const handleRemoveFavorite = async (formulaId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            
            if (!token) {
                Alert.alert(t('error'), t('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'));
                return;
            }
            
            const response = await fetch('http://26.74.118.195:5000/users/remove-favorite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    formulaId
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                Alert.alert(t('error'), data.message || t('Không thể xóa khỏi danh sách yêu thích.'));
                return;
            }
            
            // Update UI by removing the formula
            setFavorites(favorites.filter(formula => formula._id !== formulaId));
            
            // Update favorite count in user data
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                const updatedUser = { 
                    ...user, 
                    favoriteFormulas: Math.max(0, user.favoriteFormulas - 1) 
                };
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            }
            
            Alert.alert(t('success'), t('removed_from_favorites'));
        } catch (error) {
            console.error('Error removing favorite:', error);
            Alert.alert(t('error'), t('Không thể xóa khỏi danh sách yêu thích. Vui lòng thử lại sau.'));
        }
    };

    const goToFormulaDetail = (formula) => {
        navigation.navigate('FormulaDetail', { formula });
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.formulaItem} 
            onPress={() => goToFormulaDetail(item)}
        >
            <View style={styles.formulaContent}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.gradeTag}>{t('grade', { number: item.grade })}</Text>
            </View>
            
            <View style={styles.actionButtons}>
                <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemoveFavorite(item._id)}
                >
                    <Icon name="trash" size={18} color="#ff4081" />
                </TouchableOpacity>
                <Icon name="chevron-right" size={16} color={COLORS.primary} style={styles.arrowIcon} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={22} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.header}>{t('favorite_formulas')}</Text>
            </View>
            
            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
            ) : favorites.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="heart-o" size={60} color="#ddd" />
                    <Text style={styles.emptyText}>
                        {t('no_favorites')}
                    </Text>
                    <TouchableOpacity 
                        style={styles.browseButton}
                        onPress={() => navigation.navigate('MainApp')}
                    >
                        <Text style={styles.browseButtonText}>{t('browse_formulas')}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backBtn: {
        marginRight: 10,
        padding: 4,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.textDark,
    },
    list: {
        padding: 16,
        paddingBottom: 40,
    },
    formulaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        padding: 16,
        borderRadius: 10,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    formulaContent: {
        flex: 1,
        paddingRight: 10,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 16,
        color: COLORS.textDark,
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    gradeTag: {
        alignSelf: 'flex-start',
        backgroundColor: '#f0f8f0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        fontSize: 12,
        color: COLORS.primaryDark,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    removeButton: {
        padding: 8,
        marginRight: 8,
    },
    arrowIcon: {
        marginLeft: 5,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
        marginTop: 16,
        marginBottom: 24,
        textAlign: 'center',
    },
    browseButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    browseButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default FavoriteFormulasScreen; 