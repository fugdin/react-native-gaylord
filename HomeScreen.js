import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    Button, 
    FlatList, 
    StyleSheet, 
    Alert, 
    TouchableOpacity, 
    Image,
    StatusBar,
    SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';

const gradeData = [
    { id: 1, grade: 1, label: 'TOÁN 1', image: 'https://img.freepik.com/free-vector/math-class-illustration_23-2148898572.jpg', category: 'Tiểu học' },
    { id: 2, grade: 2, label: 'TOÁN 2', image: 'https://img.freepik.com/free-vector/hand-drawn-mathematics-background_23-2148156326.jpg', category: 'Tiểu học' },
    { id: 3, grade: 3, label: 'TOÁN 3', image: 'https://img.freepik.com/free-vector/kids-learning-math_23-2148893402.jpg', category: 'Tiểu học' },
    { id: 4, grade: 4, label: 'TOÁN 4', image: 'https://img.freepik.com/free-vector/flat-mathematics-background_23-2148156327.jpg', category: 'Tiểu học' },
    { id: 5, grade: 5, label: 'TOÁN 5', image: 'https://img.freepik.com/free-photo/schoolboy-solving-math-problem_23-2148893401.jpg', category: 'Tiểu học' },
    { id: 6, grade: 6, label: 'TOÁN 6', image: 'https://img.freepik.com/free-vector/abstract-mathematics-background_23-2148156328.jpg', category: 'THCS' },
    { id: 7, grade: 7, label: 'TOÁN 7', image: 'https://img.freepik.com/free-vector/brainstorming-concept-illustration_114360-734.jpg', category: 'THCS' },
    { id: 8, grade: 8, label: 'TOÁN 8', image: 'https://img.freepik.com/free-vector/hand-drawn-mathematics-background_23-2148156329.jpg', category: 'THCS' },
    { id: 9, grade: 9, label: 'TOÁN 9', image: 'https://img.freepik.com/free-vector/hand-drawn-mathematics-background_23-2148156330.jpg', category: 'THCS' },
    { id: 10, grade: 10, label: 'TOÁN 10', image: 'https://img.freepik.com/free-vector/hand-drawn-mathematics-background_23-2148156331.jpg', category: 'THPT' },
    { id: 11, grade: 11, label: 'TOÁN 11', image: 'https://img.freepik.com/free-vector/hand-drawn-mathematics-background_23-2148156332.jpg', category: 'THPT' },
    { id: 12, grade: 12, label: 'TOÁN 12', image: 'https://img.freepik.com/free-vector/hand-drawn-mathematics-background_23-2148156333.jpg', category: 'THPT' },
];

const HomeScreen = ({ navigation, setUser }) => {
    const [formulas, setFormulas] = useState([]);
    const [localUser, setLocalUser] = useState(null);
    const [categories, setCategories] = useState({});

    useEffect(() => {
        // Group grades by category
        const groupedCategories = gradeData.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {});
        setCategories(groupedCategories);
        
        const fetchData = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const userData = await AsyncStorage.getItem('user');
                if (userData) setLocalUser(JSON.parse(userData));

                const response = await fetch('http://26.74.118.195:5000/formulas', {
                    headers: {
                        'Authorization': token ? `Bearer ${token}` : undefined,
                    },
                });
                const data = await response.json();
                setFormulas(data);
            } catch (error) {
                console.error('Error fetching formulas:', error);
                Alert.alert('Lỗi', 'Không thể tải danh sách công thức.');
            }
        };

        fetchData();
    }, []);

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            setUser(null);
            Alert.alert('Đăng xuất', 'Bạn đã đăng xuất.');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const renderGradeItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.gradeBox}
            onPress={() => navigation.navigate('FormulaList', { grade: item.grade })}
        >
            <Image source={{ uri: item.image }} style={styles.gradeImage} />
            <View style={styles.gradeContent}>
                <Text style={styles.gradeLabel}>{item.label}</Text>
                <View style={styles.viewDetailsContainer}>
                    <Text style={styles.viewDetails}>Xem chi tiết</Text>
                    <Icon name="chevron-right" size={12} color="#008080" />
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderCategorySection = ({ item: category }) => {
        const grades = categories[category] || [];
        return (
            <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category}</Text>
                <FlatList
                    data={grades}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderGradeItem}
                    numColumns={2}
                    contentContainerStyle={styles.gradesGrid}
                />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Math Formula</Text>
                    <Text style={styles.headerSubtitle}>Tìm kiếm công thức toán học</Text>
                </View>
                
                <TouchableOpacity 
                    style={styles.searchButton}
                    onPress={() => navigation.navigate('Search')}
                >
                    <Icon name="search" size={22} color="#fff" />
                </TouchableOpacity>
            </View>
            
            <View style={styles.welcomeSection}>
                {localUser && (
                    <View style={styles.welcomeHeader}>
                        <Text style={styles.welcomeText}>
                            Xin chào, <Text style={styles.usernameText}>{localUser.username}</Text>
                        </Text>
                        <TouchableOpacity
                            style={styles.profileButton}
                            onPress={() => navigation.navigate('Profile')}
                        >
                            <Icon name="user-circle" size={24} color="#ff4081" />
                        </TouchableOpacity>
                    </View>
                )}
                <TouchableOpacity 
                    style={styles.quickSearchButton}
                    onPress={() => navigation.navigate('Search')}
                >
                    <Icon name="search" size={18} color="#ff4081" style={styles.quickSearchIcon} />
                    <Text style={styles.quickSearchText}>Tìm kiếm công thức</Text>
                </TouchableOpacity>
            </View>
            
            <FlatList
                data={Object.keys(categories)}
                keyExtractor={item => item}
                renderItem={renderCategorySection}
                contentContainerStyle={styles.categoriesContainer}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={
                    localUser && (
                        <View style={styles.profileSection}>
                            <View style={styles.profileHeader}>
                                <Text style={styles.profileTitle}>Thông tin tài khoản</Text>
                                <View style={styles.profileRole}>
                                    <Icon name={localUser.role === 'admin' ? 'shield' : 'user'} size={14} color="#ff4081" />
                                    <Text style={styles.roleText}>
                                        {localUser.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity 
                                style={styles.logoutButton} 
                                onPress={handleLogout}
                            >
                                <Icon name="sign-out" size={18} color="#fff" style={styles.logoutIcon} />
                                <Text style={styles.logoutText}>Đăng xuất</Text>
                            </TouchableOpacity>
                        </View>
                    )
                }
            />
        </SafeAreaView>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    searchButton: {
        backgroundColor: '#ff4081',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    welcomeSection: {
        padding: 20,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    welcomeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    welcomeText: {
        fontSize: 16,
        color: '#444',
    },
    usernameText: {
        fontWeight: 'bold',
        color: '#333',
    },
    quickSearchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    quickSearchIcon: {
        marginRight: 10,
    },
    quickSearchText: {
        color: '#ff4081',
        fontWeight: '500',
        fontSize: 15,
    },
    categoriesContainer: {
        paddingBottom: 24,
    },
    categorySection: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    gradesGrid: {
        paddingBottom: 8,
    },
    gradeBox: {
        flex: 1,
        margin: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    gradeImage: {
        width: '100%',
        height: 80,
        resizeMode: 'cover',
    },
    gradeContent: {
        padding: 12,
    },
    gradeLabel: {
        fontWeight: 'bold',
        fontSize: 15,
        color: '#333',
        marginBottom: 4,
    },
    viewDetailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewDetails: {
        fontSize: 12,
        color: '#008080',
        fontWeight: '500',
        marginRight: 4,
    },
    profileSection: {
        marginTop: 24,
        marginHorizontal: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    profileHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    profileTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    profileRole: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
    },
    roleText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    logoutButton: {
        flexDirection: 'row',
        backgroundColor: '#ff4081',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutIcon: {
        marginRight: 8,
    },
    logoutText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    profileButton: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
});
