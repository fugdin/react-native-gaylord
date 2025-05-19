import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    FlatList, 
    TouchableOpacity, 
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    SafeAreaView,
    Animated
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

// Color theme to match HomeScreen
const COLORS = {
    primary: '#86bc4b',      // Medium green (matching HomeScreen)
    primaryDark: '#4a8522',  // Darker green
    textDark: '#2a4d16',     // Very dark green for text
    accent: '#ffffff',       // White for contrast
    background: '#f8f9fa'    // Light background
};

const SearchScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        loadRecentSearches();
        // Fade in animation when screen loads
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
        }).start();
    }, []);

    const loadRecentSearches = async () => {
        try {
            const savedSearches = await AsyncStorage.getItem('recentSearches');
            if (savedSearches) {
                setRecentSearches(JSON.parse(savedSearches));
            }
        } catch (error) {
            console.error('Error loading recent searches:', error);
        }
    };

    const saveSearch = async (query) => {
        if (!query.trim()) return;
        
        try {
            // Add to recent searches, avoiding duplicates and keeping only last 5
            const updatedSearches = [
                query, 
                ...recentSearches.filter(item => item !== query)
            ].slice(0, 5);
            
            setRecentSearches(updatedSearches);
            await AsyncStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
        } catch (error) {
            console.error('Error saving search:', error);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`http://26.74.118.195:5000/formulas/search?query=${encodeURIComponent(searchQuery)}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : undefined,
                },
            });
            
            const data = await response.json();
            setSearchResults(data);
            saveSearch(searchQuery);
        } catch (error) {
            console.error('Error searching formulas:', error);
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleRecentSearchPress = (query) => {
        setSearchQuery(query);
        // Auto search when pressing a recent search
        setTimeout(() => {
            handleSearch();
        }, 100);
    };

    const renderFormulaItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.resultItem}
            onPress={() => navigation.navigate('FormulaDetail', { formula: item })}
            activeOpacity={0.7}
        >
            <View style={styles.resultContent}>
                <Text style={styles.resultTitle}>{item.title}</Text>
                <Text style={styles.resultDescription} numberOfLines={2}>
                    {item.description}
                </Text>
                <View style={styles.resultMeta}>
                    <View style={styles.gradeBadge}>
                        <Text style={styles.gradeText}>{t('grade', { number: item.grade })}</Text>
                    </View>
                </View>
            </View>
            <Icon name="chevron-right" size={18} color="#ccc" />
        </TouchableOpacity>
    );

    const renderRecentSearch = ({ item }) => (
        <TouchableOpacity 
            style={styles.recentSearchItem}
            onPress={() => handleRecentSearchPress(item)}
            activeOpacity={0.6}
        >
            <Icon name="history" size={16} color="#999" style={styles.recentSearchIcon} />
            <Text style={styles.recentSearchText} numberOfLines={1}>{item}</Text>
            <TouchableOpacity 
                style={styles.recentSearchRemove}
                onPress={() => {
                    const updated = recentSearches.filter(search => search !== item);
                    setRecentSearches(updated);
                    AsyncStorage.setItem('recentSearches', JSON.stringify(updated));
                }}
            >
                <Icon name="times" size={14} color="#ccc" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    style={styles.backBtn}
                    activeOpacity={0.7}
                >
                    <Icon name="arrow-left" size={22} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('search_formula')}</Text>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('search_placeholder')}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                        onSubmitEditing={handleSearch}
                        autoFocus={true}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity 
                            onPress={handleClearSearch} 
                            style={styles.clearButton}
                            activeOpacity={0.7}
                        >
                            <Icon name="times-circle" size={18} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity 
                    style={styles.searchButton} 
                    onPress={handleSearch}
                    activeOpacity={0.8}
                >
                    <Text style={styles.searchButtonText}>{t('search')}</Text>
                </TouchableOpacity>
            </View>

            <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#ff4081" />
                        <Text style={styles.loadingText}>{t('searching')}</Text>
                    </View>
                ) : (
                    <View style={styles.resultsContainer}>
                        {searchResults.length > 0 ? (
                            <>
                                <View style={styles.resultsSummary}>
                                    <Text style={styles.resultCount}>
                                        {t('search_results', { count: searchResults.length })}
                                    </Text>
                                </View>
                                <FlatList
                                    data={searchResults}
                                    keyExtractor={(item) => item._id.toString()}
                                    renderItem={renderFormulaItem}
                                    contentContainerStyle={styles.resultsList}
                                    showsVerticalScrollIndicator={false}
                                />
                            </>
                        ) : searchQuery.length > 0 && !isLoading ? (
                            <View style={styles.noResultsContainer}>
                                <Icon name="search" size={50} color="#e0e0e0" />
                                <Text style={styles.noResultsText}>{t('no_results')}</Text>
                                <Text style={styles.noResultsSubText}>
                                    {t('try_different_keyword')}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.recentSearchesContainer}>
                                {recentSearches.length > 0 ? (
                                    <>
                                        <View style={styles.recentSearchesHeader}>
                                            <Text style={styles.recentSearchesTitle}>{t('recent_searches')}</Text>
                                            <TouchableOpacity 
                                                onPress={() => {
                                                    setRecentSearches([]);
                                                    AsyncStorage.removeItem('recentSearches');
                                                }}
                                                style={styles.clearAllButton}
                                            >
                                                <Text style={styles.clearAllText}>{t('clear_all')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <FlatList
                                            data={recentSearches}
                                            keyExtractor={(item, index) => `search-${index}`}
                                            renderItem={renderRecentSearch}
                                            contentContainerStyle={styles.recentSearchesList}
                                        />
                                    </>
                                ) : (
                                    <View style={styles.emptyStateContainer}>
                                        <Icon name="search" size={40} color="#f0f0f0" />
                                        <Text style={styles.emptyStateText}>
                                            {t('type_to_search')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                )}
            </Animated.View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backBtn: {
        padding: 8,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textDark,
    },
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginRight: 12,
        height: 46,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 46,
        fontSize: 16,
        color: '#333',
    },
    clearButton: {
        padding: 8,
    },
    searchButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingHorizontal: 16,
        height: 46,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    searchButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    contentContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        color: '#666',
        fontSize: 16,
    },
    resultsContainer: {
        flex: 1,
    },
    resultsSummary: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    resultCount: {
        fontSize: 14,
        color: '#666',
    },
    resultsList: {
        padding: 16,
    },
    resultItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    resultContent: {
        flex: 1,
    },
    resultTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 6,
    },
    resultDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
        lineHeight: 20,
    },
    resultMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    gradeBadge: {
        backgroundColor: '#fff0f6',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ffcce6',
    },
    gradeText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '500',
    },
    noResultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    noResultsText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#555',
        marginTop: 16,
    },
    noResultsSubText: {
        fontSize: 15,
        color: '#888',
        marginTop: 8,
        textAlign: 'center',
    },
    recentSearchesContainer: {
        flex: 1,
        padding: 16,
    },
    recentSearchesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    recentSearchesTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    clearAllButton: {
        padding: 6,
    },
    clearAllText: {
        fontSize: 14,
        color: COLORS.primary,
    },
    recentSearchesList: {
        paddingBottom: 20,
    },
    recentSearchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    recentSearchIcon: {
        marginRight: 12,
        color: COLORS.primary,
    },
    recentSearchText: {
        flex: 1,
        fontSize: 15,
        color: '#444',
    },
    recentSearchRemove: {
        padding: 8,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 22,
    },
});

export default SearchScreen; 