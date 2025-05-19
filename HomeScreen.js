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
import { useTranslation } from 'react-i18next';

// Color theme
const COLORS = {
    primaryLight: '#f8f9fa', // Light background color (matching App.js)
    primary: '#86bc4b',      // Medium green for elements (matching App.js)
    primaryDark: '#4a8522',  // Darker green for active elements
    textDark: '#2a4d16',     // Very dark green for text
    accent: '#ffffff',       // White for contrast
    example: '#dcf2d7'       // Light mint green for example boxes
};

const HomeScreen = ({ navigation, setUser }) => {
    const { t } = useTranslation();
    const [formulas, setFormulas] = useState([]);
    const [localUser, setLocalUser] = useState(null);
    const [categories, setCategories] = useState({});

    // Define gradeData using translations
    const gradeData = [
        { id: 1, grade: 1, label: t('math_grade', { grade: 1 }), image: 'https://img.freepik.com/free-vector/math-class-illustration_23-2148898572.jpg', category: t('elementary') },
        { id: 2, grade: 2, label: t('math_grade', { grade: 2 }), image: 'https://img.freepik.com/free-vector/hand-drawn-mathematics-background_23-2148156326.jpg', category: t('elementary') },
        { id: 3, grade: 3, label: t('math_grade', { grade: 3 }), image: 'https://img.freepik.com/free-vector/kids-learning-math_23-2148893402.jpg', category: t('elementary') },
        { id: 4, grade: 4, label: t('math_grade', { grade: 4 }), image: 'https://img.freepik.com/free-vector/flat-mathematics-background_23-2148156327.jpg', category: t('elementary') },
        { id: 5, grade: 5, label: t('math_grade', { grade: 5 }), image: 'https://img.freepik.com/free-photo/schoolboy-solving-math-problem_23-2148893401.jpg', category: t('elementary') },
        { id: 6, grade: 6, label: t('math_grade', { grade: 6 }), image: 'https://img.freepik.com/free-vector/abstract-mathematics-background_23-2148156328.jpg', category: t('middle_school') },
        { id: 7, grade: 7, label: t('math_grade', { grade: 7 }), image: 'https://img.freepik.com/free-vector/brainstorming-concept-illustration_114360-734.jpg', category: t('middle_school') },
        { id: 8, grade: 8, label: t('math_grade', { grade: 8 }), image: 'https://img.freepik.com/free-vector/hand-drawn-mathematics-background_23-2148156329.jpg', category: t('middle_school') },
        { id: 9, grade: 9, label: t('math_grade', { grade: 9 }), image: 'https://img.freepik.com/free-vector/hand-drawn-mathematics-background_23-2148156330.jpg', category: t('middle_school') },
        { id: 10, grade: 10, label: t('math_grade', { grade: 10 }), image: 'https://img.freepik.com/free-vector/hand-drawn-mathematics-background_23-2148156331.jpg', category: t('high_school') },
        { id: 11, grade: 11, label: t('math_grade', { grade: 11 }), image: 'https://img.freepik.com/free-vector/hand-drawn-mathematics-background_23-2148156332.jpg', category: t('high_school') },
        { id: 12, grade: 12, label: t('math_grade', { grade: 12 }), image: 'https://img.freepik.com/free-vector/hand-drawn-mathematics-background_23-2148156333.jpg', category: t('high_school') },
    ];

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
                Alert.alert(t('error'), t('Không thể tải danh sách công thức.'));
            }
        };

        fetchData();
    }, [t]);

    const renderGradeItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.gradeBox}
            onPress={() => navigation.navigate('FormulaList', { grade: item.grade })}
        >
            <Image source={{ uri: item.image }} style={styles.gradeImage} />
            <View style={styles.gradeContent}>
                <Text style={styles.gradeLabel}>{item.label}</Text>
                <View style={styles.viewDetailsContainer}>
                    <Text style={styles.viewDetails}>{t('view_details')}</Text>
                    <Icon name="chevron-right" size={12} color={COLORS.primaryDark} />
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
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.primaryLight} />
            
            <View style={styles.combinedHeader}>
                <View style={styles.headerTop}>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>{t('app_name')}</Text>
                        
                    </View>
                    
                    
                </View>
                
                {localUser && (
                    <View style={styles.welcomeHeader}>
                        <Text style={styles.welcomeText}>
                            {t('hello')}, <Text style={styles.usernameText}>{localUser.username}</Text>
                        </Text>
                        <TouchableOpacity
                            style={styles.profileButton}
                            onPress={() => navigation.navigate('Profile')}
                        >
                            <Icon name="user-circle" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                )}
                <TouchableOpacity 
                    style={styles.quickSearchButton}
                    onPress={() => navigation.navigate('Search')}
                >
                    <Icon name="search" size={18} color={COLORS.primary} style={styles.quickSearchIcon} />
                    <Text style={styles.quickSearchText}>{t('search_formula')}</Text>
                </TouchableOpacity>
            </View>
            
            <FlatList
                data={Object.keys(categories)}
                keyExtractor={item => item}
                renderItem={renderCategorySection}
                contentContainerStyle={styles.categoriesContainer}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primaryLight,
    },
    combinedHeader: {
        backgroundColor: '#fff',
        borderRadius: 12,
        margin: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textDark,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.primaryDark,
        marginTop: 2,
    },
    searchButton: {
        backgroundColor: COLORS.primary,
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
    welcomeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    welcomeText: {
        fontSize: 16,
        color: COLORS.textDark,
    },
    usernameText: {
        fontWeight: 'bold',
        color: COLORS.primaryDark,
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
        color: COLORS.primary,
        fontWeight: '500',
        fontSize: 15,
    },
    categoriesContainer: {
        paddingBottom: 100, // Add extra padding to account for the tab bar
    },
    categorySection: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textDark,
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
        color: COLORS.textDark,
        marginBottom: 4,
    },
    viewDetailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewDetails: {
        fontSize: 12,
        color: COLORS.primaryDark,
        fontWeight: '500',
        marginRight: 4,
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
