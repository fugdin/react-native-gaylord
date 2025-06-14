import React, { useState } from 'react';
import { View, TextInput, Alert, StyleSheet, Text, TouchableOpacity, ImageBackground } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';

const RegisterScreen = () => {
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigation = useNavigation();

    const handleRegister = async () => {
        try {
            if (!username || !password || !email) {
                Alert.alert(t('error'), t('fill_all_fields'));
                return;
            }

            if (password !== confirmPassword) {
                Alert.alert(t('error'), t('passwords_not_match'));
                return;
            }

            const response = await axios.post('http://26.74.118.195:5000/api/register', {
                username,
                email,
                password
            });
            
            Alert.alert(t('success'), t('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.'));
            navigation.navigate('Login');
        } catch (error) {
            console.error('Registration error:', error);
            let errorMessage = t('unexpected_error');
            
            if (error.response) {
                // Server trả về lỗi
                errorMessage = error.response.data.message || errorMessage;
            } else if (error.request) {
                // Không nhận được phản hồi từ server
                errorMessage = t('network_error');
            }
            
            Alert.alert(
                t('Đăng ký thất bại'),
                errorMessage
            );
        }
    };

    return (
        <ImageBackground
            source={{ uri: 'https://img-baofun.zhhainiao.com/pcwallpaper_ugc_mobile/static/567e9bb9dbe926ebe2c1315579e55440.jpg?x-oss-process=image/resize,m_lfit,w_640,h_1138' }}
            style={styles.backgroundImage}
        >
            <View style={styles.overlay}>
                <View style={styles.formContainer}>
                    <Text style={styles.title}>{t('create_account')}</Text>

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
                        <Icon name="envelope" size={20} color="#fff" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder={t('email')}
                            placeholderTextColor="#fff"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
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

                    <View style={styles.inputContainer}>
                        <Icon name="lock" size={20} color="#fff" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder={t('confirm_password')}
                            placeholderTextColor="#fff"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity 
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={styles.eyeIcon}
                        >
                            <Icon name={showConfirmPassword ? "eye" : "eye-slash"} size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                        style={styles.registerButton} 
                        onPress={handleRegister}
                    >
                        <Text style={styles.registerButtonText}>{t('register_now')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.loginContainer}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.loginText}>{t('already_have_account')} </Text>
                        <Text style={styles.loginLink}>{t('login_now')}</Text>
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
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
    registerButton: {
        backgroundColor: '#ff4081',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        color: '#fff',
        fontSize: 14,
    },
    loginLink: {
        color: '#ff4081',
        fontSize: 14,
        fontWeight: 'bold',
    },
    eyeIcon: {
        padding: 10,
    },
});

export default RegisterScreen;
