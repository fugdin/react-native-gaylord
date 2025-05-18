import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';

// Import screens
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import HomeScreen from './HomeScreen';
import AdminScreen from './AdminScreen';
import FormulaListScreen from './FormulaListScreen';
import FormulaDetailScreen from './FormulaDetailScreen';
import SearchScreen from './SearchScreen';
import ProfileScreen from './ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = ({ setUser, user }) => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
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
                    return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#ff4081',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Home">
                {props => <HomeScreen {...props} setUser={setUser} />}
            </Tab.Screen>
            <Tab.Screen name="Search" component={SearchScreen} />
            {user?.role === 'admin' && (
                <Tab.Screen name="Admin" component={AdminScreen} />
            )}
            <Tab.Screen name="Profile">
                {props => <ProfileScreen {...props} />}
            </Tab.Screen>
        </Tab.Navigator>
    );
};

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
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <>
                        <Stack.Screen name="MainApp">
                            {props => <TabNavigator {...props} setUser={setUser} user={user} />}
                        </Stack.Screen>
                        <Stack.Screen name="FormulaList" component={FormulaListScreen} />
                        <Stack.Screen name="FormulaDetail" component={FormulaDetailScreen} />
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
    );
};

export default App;
