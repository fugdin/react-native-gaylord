import React, { useState } from 'react';
import { View, TextInput, Alert, StyleSheet, Text, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';

const LoginScreen = ({ setUser }) => {
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
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

            Alert.alert(t('login_successful'));
            setUser(response.data.user);
        } catch (error) {
            console.error('Login error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers
            });
            
            if (error.code === 'ECONNREFUSED') {
                Alert.alert(t('connection_error'), t('network_error'));
            } else if (error.response) {
                // Server trả về lỗi
                Alert.alert(t('login_failed'), error.response.data.message || t('invalid_credentials'));
            } else if (error.request) {
                // Không nhận được phản hồi từ server
                Alert.alert(t('connection_error'), t('network_error'));
            } else {
                Alert.alert(t('error'), t('unexpected_error'));
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
                    <Text style={styles.title}>{t('welcome_back')}</Text>

                    <View style={styles.inputContainer}>
                        <Icon name="user" size={20} color="#fff" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder={t('username')}
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
                            placeholder={t('password')}
                            placeholderTextColor="#fff"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity 
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeIcon}
                        >
                            <Icon name={showPassword ? "eye" : "eye-slash"} size={20} color="#fff" />
                        </TouchableOpacity>
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
                            <Text style={styles.rememberText}>{t('remember_me')}</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                        <Text style={styles.loginButtonText}>{t('login')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.registerContainer}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <Text style={styles.registerText}>{t('dont_have_account')} </Text>
                        <Text style={styles.registerLink}>{t('register_now')}</Text>
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
        backgroundColor: '#ffffff',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#6a3de8',
    },
    loginButtonText: {
        color: '#6a3de8',
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
        color: '#6a3de8',
        fontSize: 14,
        fontWeight: 'bold',
    },
    eyeIcon: {
        padding: 10,
    },
});

export default LoginScreen;