import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  
  // Default user data
  const defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=random&color=fff&size=200';
  const defaultCover = 'https://images.unsplash.com/photo-1633613286991-611fe299c4be?q=80&w=2070&auto=format&fit=crop';
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          // Add default values if not present
          const enhancedUser = {
            ...parsedUser,
            avatar: parsedUser.avatar || defaultAvatar,
            coverPhoto: parsedUser.coverPhoto || defaultCover,
            bio: parsedUser.bio || 'Chưa có mô tả.', 
            joinDate: parsedUser.joinDate || new Date().toISOString().split('T')[0],
            favoriteFormulas: parsedUser.favoriteFormulas || 0,
            lastActive: 'Hôm nay'
          };
          setUser(enhancedUser);
          setEditedBio(enhancedUser.bio);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      Alert.alert('Đăng xuất', 'Bạn đã đăng xuất thành công.');

      // Trigger the app state change
      // Use navigation.navigate instead of reset to make sure we trigger the App.js setUser check
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      const updatedUser = { ...user, bio: editedBio };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditing(false);
      Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân.');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin.');
    }
  };

  const handleChangePhoto = async (type) => {
    try {
      setModalVisible(false);
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh để thay đổi ảnh.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'avatar' ? [1, 1] : [16, 9],
        quality: 0.5,
      });
      
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const updatedUser = { ...user };
        
        if (type === 'avatar') {
          updatedUser.avatar = uri;
        } else {
          updatedUser.coverPhoto = uri;
        }
        
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Error changing photo:', error);
      Alert.alert('Lỗi', 'Không thể thay đổi ảnh.');
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Cover Photo */}
      <View style={styles.coverContainer}>
        <Image 
          source={{ uri: user.coverPhoto }} 
          style={styles.coverPhoto} 
        />
        <TouchableOpacity 
          style={styles.editCoverButton}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="camera" size={16} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Avatar and Basic Info */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: user.avatar }} 
            style={styles.avatar} 
          />
          <TouchableOpacity 
            style={styles.editAvatarButton}
            onPress={() => handleChangePhoto('avatar')}
          >
            <Icon name="camera" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.userInfo}>
          <View style={styles.nameContainer}>
            <Text style={styles.username}>{user.username}</Text>
            <View style={styles.badgeContainer}>
              <Icon 
                name={user.role === 'admin' ? 'shield' : 'user'} 
                size={12} 
                color="#fff" 
              />
              <Text style={styles.badgeText}>
                {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
              </Text>
            </View>
          </View>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.favoriteFormulas}</Text>
            <Text style={styles.statLabel}>Công thức đã lưu</Text>
          </View>
          <View style={[styles.statItem, styles.statDivider]}>
            <Text style={styles.statValue}>{user.joinDate}</Text>
            <Text style={styles.statLabel}>Ngày tham gia</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.lastActive}</Text>
            <Text style={styles.statLabel}>Hoạt động gần đây</Text>
          </View>
        </View>
        
        {/* Bio Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Giới thiệu</Text>
            {!isEditing && (
              <TouchableOpacity onPress={handleEditProfile}>
                <Icon name="pencil" size={16} color="#ff4081" />
              </TouchableOpacity>
            )}
          </View>
          
          {isEditing ? (
            <View style={styles.editBioContainer}>
              <TextInput
                style={styles.bioInput}
                value={editedBio}
                onChangeText={setEditedBio}
                multiline
                placeholder="Nhập giới thiệu về bạn..."
              />
              <View style={styles.editActions}>
                <TouchableOpacity 
                  style={[styles.editButton, styles.cancelButton]}
                  onPress={() => {
                    setIsEditing(false);
                    setEditedBio(user.bio);
                  }}
                >
                  <Text style={styles.editButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.editButton, styles.saveButton]}
                  onPress={handleSaveProfile}
                >
                  <Text style={styles.editButtonText}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.bioText}>{user.bio}</Text>
          )}
        </View>
        
        {/* Settings Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Cài đặt</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Icon name="bell" size={18} color="#555" style={styles.settingIcon} />
            <Text style={styles.settingText}>Thông báo</Text>
            <Icon name="chevron-right" size={16} color="#ccc" style={styles.settingArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Icon name="lock" size={18} color="#555" style={styles.settingIcon} />
            <Text style={styles.settingText}>Bảo mật</Text>
            <Icon name="chevron-right" size={16} color="#ccc" style={styles.settingArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Icon name="heart" size={18} color="#555" style={styles.settingIcon} />
            <Text style={styles.settingText}>Công thức yêu thích</Text>
            <Icon name="chevron-right" size={16} color="#ccc" style={styles.settingArrow} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Icon name="language" size={18} color="#555" style={styles.settingIcon} />
            <Text style={styles.settingText}>Ngôn ngữ</Text>
            <Icon name="chevron-right" size={16} color="#ccc" style={styles.settingArrow} />
          </TouchableOpacity>
        </View>
        
        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Icon name="sign-out" size={18} color="#fff" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Photo Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thay đổi ảnh</Text>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => handleChangePhoto('avatar')}
            >
              <Icon name="user-circle" size={20} color="#ff4081" style={styles.modalIcon} />
              <Text style={styles.modalOptionText}>Thay đổi ảnh đại diện</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => handleChangePhoto('cover')}
            >
              <Icon name="image" size={20} color="#ff4081" style={styles.modalIcon} />
              <Text style={styles.modalOptionText}>Thay đổi ảnh bìa</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeModalText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverContainer: {
    height: 180,
    position: 'relative',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  editCoverButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    flexDirection: 'row',
    marginTop: -50,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
  },
  editAvatarButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
    paddingBottom: 5,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4081',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#f0f0f0',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  bioText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  editBioContainer: {
    marginBottom: 8,
  },
  bioInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
  },
  saveButton: {
    backgroundColor: '#ff4081',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    marginRight: 12,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  settingArrow: {
    marginLeft: 'auto',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff4081',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalIcon: {
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  closeModalButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
  },
  closeModalText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});

export default ProfileScreen; 