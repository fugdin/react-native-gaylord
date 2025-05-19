import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import { View, StyleSheet, TouchableOpacity, Animated, Dimensions, StatusBar, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Import i18n configuration
import './i18n/i18n'; // Initialize i18n
import { LanguageProvider } from './i18n/LanguageContext';

// Import screens
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import HomeScreen from './HomeScreen';
import AdminScreen from './AdminScreen';
import FormulaListScreen from './FormulaListScreen';
import FormulaDetailScreen from './FormulaDetailScreen';
import SearchScreen from './SearchScreen';
import ProfileScreen from './ProfileScreen';
import FavoriteFormulasScreen from './FavoriteFormulasScreen';

// Luxurious Color theme
const COLORS = {
  primary: '#86bc4b',         // Green primary color (from HomeScreen)
  primaryLight: '#f8f9fa',    // Light background
  primaryDark: '#4a8522',     // Dark green (from HomeScreen)
  secondary: '#ffffff',       // White - for accents
  secondaryLight: '#f8f8f8',  // Very light gray - for soft highlights
  tertiary: '#3db9e8',        // Bright blue - for additional accents
  gold: '#ffd54f',           // Gold - for luxury elements
  gradientStart: '#86bc4b',   // Gradient start - green
  gradientEnd: '#4a8522',     // Gradient end - dark green
  text: '#2a4d16',           // Dark green text (from HomeScreen)
  backgroundLight: '#ffffff',  // White - for card backgrounds
  backgroundDark: '#f0f0fa',  // Very light blue-purple - for section backgrounds
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Custom Tab Bar Component with animation and toggle
function CustomTabBar({ state, descriptors, navigation, visible, toggleTabBar }) {
    const translateY = useRef(new Animated.Value(visible ? 0 : 100)).current;
    const buttonTranslateY = useRef(new Animated.Value(visible ? 0 : 100)).current;
    const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: visible ? 0 : 100,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(buttonTranslateY, {
                toValue: visible ? 0 : 100,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: visible ? 1 : 0,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start();
    }, [visible, translateY, buttonTranslateY, fadeAnim]);

    return (
        <View style={styles.tabBarContainer}>
            {/* Tab Bar - Slides up/down */}
            <Animated.View
                style={[
                    styles.tabBar,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: translateY }]
                    }
                ]}
            >
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    let iconName;
                    if (route.name === 'Home') {
                        iconName = 'home';
                    } else if (route.name === 'Admin') {
                        iconName = 'cog';
                    } else if (route.name === 'Search') {
                        iconName = 'search';
                    } else if (route.name === 'Profile') {
                        iconName = 'user';
                    }

                    return (
                        <TouchableOpacity
                            key={index}
                            activeOpacity={0.7}
                            onPress={onPress}
                            style={styles.tabItem}
                        >
                            <View style={[
                                styles.iconContainer,
                                route.name === 'Home' && isFocused ? styles.activeHomeIcon : null
                            ]}>
                                <Icon
                                    name={iconName}
                                    size={20}
                                    color={isFocused ? COLORS.primary : '#8f9596'}
                                />
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </Animated.View>

            {/* Visible Toggle Button */}
            <View style={styles.fixedButtonContainer}>
                <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={toggleTabBar}
                >
                    <LinearGradient
                        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                        style={styles.gradient}
                    >
                        <Icon 
                            name={visible ? "chevron-down" : "chevron-up"} 
                            size={10} 
                            color="#fff" 
                        />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const TabNavigator = ({ setUser, user }) => {
    const [tabBarVisible, setTabBarVisible] = useState(false);

    const toggleTabBar = () => {
        setTabBarVisible(!tabBarVisible);
    };

    return (
        <Tab.Navigator
            tabBar={props => (
                <CustomTabBar
                    {...props}
                    visible={tabBarVisible}
                    toggleTabBar={toggleTabBar}
                />
            )}
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
            }}
        >
            <Tab.Screen name="Home" options={{ contentStyle: { backgroundColor: COLORS.primaryLight } }}>
                {props => <HomeScreen {...props} setUser={setUser} />}
            </Tab.Screen>
            <Tab.Screen name="Search" component={SearchScreen} options={{ contentStyle: { backgroundColor: COLORS.primaryLight } }} />
            {user?.role === 'admin' && (
                <Tab.Screen name="Admin" component={AdminScreen} options={{ contentStyle: { backgroundColor: COLORS.primaryLight } }} />
            )}
            <Tab.Screen name="Profile" options={{ contentStyle: { backgroundColor: COLORS.primaryLight } }}>
                {props => <ProfileScreen {...props} setUser={setUser} />}
            </Tab.Screen>
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        height: 150,
        zIndex: 100,
    },
    fixedButtonContainer: {
        position: 'absolute',
        bottom: 20,
        width: '100%',
        alignItems: 'center',
        zIndex: 999,
    },
    toggleButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    gradient: {
        width: '100%',
        height: '100%',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 25,
        height: 65,
        width: '80%',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.secondaryLight,
        paddingHorizontal: 10,
        position: 'absolute',
        bottom: 90,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    tabItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    activeHomeIcon: {
        backgroundColor: COLORS.secondaryLight,
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLogin = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const userData = await AsyncStorage.getItem('user');
                if (token && userData) {
                    const parsedUser = JSON.parse(userData);
                    console.log('Stored user data:', parsedUser);
                    setUser(parsedUser);
                }
            } catch (error) {
                console.error('Error checking login status:', error);
            } finally {
                setLoading(false);
            }
        };

        checkLogin();
    }, []);

    if (loading) {
        return null;
    }

    return (
        <LanguageProvider>
            <StatusBar backgroundColor={COLORS.primaryLight} barStyle="dark-content" />
            <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    {user ? (
                        <>
                            <Stack.Screen name="MainApp">
                                {props => <TabNavigator {...props} setUser={setUser} user={user} />}
                            </Stack.Screen>
                            <Stack.Screen name="FormulaList" component={FormulaListScreen} />
                            <Stack.Screen name="FormulaDetail" component={FormulaDetailScreen} />
                            <Stack.Screen name="FavoriteFormulas" component={FavoriteFormulasScreen} />
                        </>
                    ) : (
                        <>
                            <Stack.Screen name="Login">
                                {props => <LoginScreen {...props} setUser={setUser} />}
                            </Stack.Screen>
                            <Stack.Screen name="Register" component={RegisterScreen} />
                        </>
                    )}
                </Stack.Navigator>
            </NavigationContainer>
        </LanguageProvider>
    );
};

export default App;
