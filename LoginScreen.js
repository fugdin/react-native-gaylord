import React, { useState } from 'react';
import { View, TextInput, Alert, StyleSheet, Text, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';

const LoginScreen = ({ setUser }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const navigation = useNavigation();

    const handleLogin = async () => {
        try {
            console.log('Attempting to login with:', { username });
            const response = await axios.post('http://26.74.118.195:5000/api/login', {
                username,
                password,
            });

            console.log('Login response:', response.data);

            // Lưu token và thông tin người dùng
            await AsyncStorage.setItem('token', response.data.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

            Alert.alert('Login Successful');
            setUser(response.data.user);
        } catch (error) {
            console.error('Login error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers
            });
            
            if (error.code === 'ECONNREFUSED') {
                Alert.alert('Connection Error', 'Cannot connect to server. Please check if the server is running.');
            } else if (error.response) {
                // Server trả về lỗi
                Alert.alert('Login Failed', error.response.data.message || 'Invalid username or password');
            } else if (error.request) {
                // Không nhận được phản hồi từ server
                Alert.alert('Connection Error', 'No response from server. Please check your internet connection.');
            } else {
                Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            }
        }
    };

    return (
        <ImageBackground
            source={{ uri: 'https://img-baofun.zhhainiao.com/pcwallpaper_ugc_mobile/static/567e9bb9dbe926ebe2c1315579e55440.jpg?x-oss-process=image/resize,m_lfit,w_640,h_1138' }}
            style={styles.backgroundImage}
        >
            <View style={styles.overlay}>
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Welcome Back</Text>

                    <View style={styles.inputContainer}>
                        <Icon name="user" size={20} color="#fff" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            placeholderTextColor="#fff"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Icon name="lock" size={20} color="#fff" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#fff"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.optionsContainer}>
                        <TouchableOpacity 
                            style={styles.checkboxContainer}
                            onPress={() => setRememberMe(!rememberMe)}
                        >
                            <Icon 
                                name={rememberMe ? "check-square" : "square-o"} 
                                size={20} 
                                color="#fff" 
                            />
                            <Text style={styles.rememberText}>Remember me</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                        <Text style={styles.loginButtonText}>Login</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.registerContainer}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <Text style={styles.registerText}>Don't have an account? </Text>
                        <Text style={styles.registerLink}>Register now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        padding: 20,
    },
    formContainer: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    title: {
        fontSize: 32,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 40,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#fff',
        marginBottom: 20,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        paddingVertical: 10,
    },
    optionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rememberText: {
        color: '#fff',
        marginLeft: 10,
    },
    loginButton: {
        backgroundColor: '#ff4081',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 20,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    registerText: {
        color: '#fff',
        fontSize: 14,
    },
    registerLink: {
        color: '#ff4081',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default LoginScreen;