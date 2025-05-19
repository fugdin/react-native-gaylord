import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { WebView } from 'react-native-webview';
import { useTranslation } from 'react-i18next';

// Color theme to match HomeScreen
const COLORS = {
    primary: '#86bc4b',      // Medium green for elements
    primaryDark: '#4a8522',  // Darker green for active elements
    textDark: '#2a4d16',     // Very dark green for text
    accent: '#ffffff',       // White for contrast
    background: '#f8f9fa'    // Light background
};

const FormulaListScreen = ({ route, navigation }) => {
    const { t } = useTranslation();
    const { grade } = route.params;
    const [formulas, setFormulas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFormulas = async () => {
            try {
                const response = await fetch(`http://26.74.118.195:5000/formulas/grade/${grade}`);
                const data = await response.json();
                setFormulas(data);
            } catch (error) {
                Alert.alert(t('error'), t('Không thể tải danh sách công thức.'));
            } finally {
                setLoading(false);
            }
        };
        fetchFormulas();
    }, [grade, t]);

    const getLatexHtml = (latexFormula) => {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
                <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
                <style>
                    body {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        margin: 0;
                        padding: 0;
                        background-color: white;
                    }
                    .formula-container {
                        padding: 5px;
                        display: flex;
                        justify-content: center;
                    }
                </style>
            </head>
            <body>
                <div class="formula-container" id="formula"></div>
                <script>
                    document.addEventListener('DOMContentLoaded', function() {
                        katex.render("${latexFormula.replace(/"/g, '\\"')}", document.getElementById('formula'), {
                            throwOnError: false,
                            displayMode: true
                        });
                    });
                </script>
            </body>
            </html>
        `;
    };

    const goToFormulaDetail = (formula) => {
        navigation.navigate('FormulaDetail', { formula });
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.formulaItem} 
            onPress={() => goToFormulaDetail(item)}
        >
            <Text style={styles.title}>{item.title}</Text>
            <Icon name="chevron-right" size={16} color={COLORS.primary} style={styles.arrowIcon} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={22} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.header}>{t('formula_list', { grade })}</Text>
            </View>
            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
            ) : (
                formulas.length === 0 ? (
                    <Text style={styles.emptyText}>{t('no_formulas')}</Text>
                ) : (
                    <FlatList
                        data={formulas}
                        keyExtractor={item => item._id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                    />
                )
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backBtn: {
        marginRight: 10,
        padding: 4,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.textDark,
    },
    list: {
        paddingBottom: 20,
    },
    formulaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
        padding: 14,
        borderRadius: 10,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 16,
        color: COLORS.textDark,
        flex: 1,
    },
    arrowIcon: {
        marginLeft: 10,
        color: COLORS.primary,
    },
    description: {
        marginTop: 4,
        fontSize: 14,
        color: '#666',
    },
    formulaContainer: {
        marginTop: 10,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 5,
    },
    webView: {
        height: 100,
        width: '100%',
        backgroundColor: 'white',
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.primaryDark,
        marginTop: 40,
        fontSize: 16,
    },
});

export default FormulaListScreen; 