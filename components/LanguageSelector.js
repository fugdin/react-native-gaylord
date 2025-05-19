import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { LanguageContext } from '../i18n/LanguageContext';

const LANGUAGES = [
  { code: 'vi', name: 'vietnamese', flag: '🇻🇳' },
  { code: 'en', name: 'english', flag: '🇬🇧' }
];

const LanguageSelector = () => {
  const { t } = useTranslation();
  const { language, setLanguage } = useContext(LanguageContext);
  const [modalVisible, setModalVisible] = useState(false);

  const selectedLanguage = LANGUAGES.find(lang => lang.code === language);

  const changeLanguage = (langCode) => {
    setLanguage(langCode);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.settingItem}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="language" size={18} color="#555" style={styles.settingIcon} />
        <Text style={styles.settingText}>{t('language')}</Text>
        <View style={styles.languageIndicator}>
          <Text style={styles.languageCode}>{selectedLanguage.flag}</Text>
          <Text style={styles.languageName}>{t(selectedLanguage.name)}</Text>
        </View>
        <Icon name="chevron-right" size={16} color="#ccc" style={styles.settingArrow} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('language')}</Text>
            
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  language === lang.code && styles.selectedLanguage
                ]}
                onPress={() => changeLanguage(lang.code)}
              >
                <Text style={styles.flagEmoji}>{lang.flag}</Text>
                <Text style={[
                  styles.languageText,
                  language === lang.code && styles.selectedLanguageText
                ]}>
                  {t(lang.name)}
                </Text>
                {language === lang.code && (
                  <Icon name="check" size={18} color="#86bc4b" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
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
  languageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  languageCode: {
    fontSize: 16,
    marginRight: 4,
  },
  languageName: {
    fontSize: 12,
    color: '#666',
  },
  settingArrow: {
    marginLeft: 8,
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
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedLanguage: {
    backgroundColor: '#f8fff5',
  },
  flagEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  languageText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  selectedLanguageText: {
    fontWeight: 'bold',
    color: '#86bc4b',
  },
  checkIcon: {
    marginLeft: 8,
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});

export default LanguageSelector; 