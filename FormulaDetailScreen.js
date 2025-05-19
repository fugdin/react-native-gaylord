import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { WebView } from 'react-native-webview';
import Markdown from 'react-native-markdown-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

// Color theme to match HomeScreen
const COLORS = {
    primary: '#86bc4b',      // Medium green for elements
    primaryDark: '#4a8522',  // Darker green for active elements
    textDark: '#2a4d16',     // Very dark green for text
    accent: '#ffffff',       // White for contrast
    background: '#f8f9fa',   // Light background
    lightGreen: '#f0f8f0'    // Light green for backgrounds
};

const FormulaDetailScreen = ({ route, navigation }) => {
    const { t } = useTranslation();
    const { formula } = route.params;
    const [example, setExample] = useState(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(false);
    const [latexHeights, setLatexHeights] = useState({});
    const webViewRefs = useRef({});
    const [isFavorite, setIsFavorite] = useState(false);
    const [savingFavorite, setSavingFavorite] = useState(false);

    useEffect(() => {
        // Check if formula is in favorites
        checkFavoriteStatus();
    }, []);

    const checkFavoriteStatus = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            
            console.log("Kiểm tra yêu thích với token:", token.substring(0, 10) + "...");
            
            const response = await fetch('http://26.74.118.195:5000/users/check-favorite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    formulaId: formula._id
                })
            });
            
            // Kiểm tra phản hồi trước khi parse JSON
            const textResponse = await response.text();
            console.log("Raw response:", textResponse.substring(0, 100) + "...");
            
            if (!response.ok) {
                console.error('Error response:', textResponse);
                return;
            }
            
            try {
                const data = JSON.parse(textResponse);
                setIsFavorite(data.isFavorite);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response was not valid JSON:', textResponse.substring(0, 200));
            }
        } catch (error) {
            console.error('Error checking favorite status:', error);
        }
    };

    const toggleFavorite = async () => {
        try {
            setSavingFavorite(true);
            const token = await AsyncStorage.getItem('token');
            
            if (!token) {
                Alert.alert('Lỗi', 'Bạn cần đăng nhập để sử dụng tính năng này');
                setSavingFavorite(false);
                return;
            }
            
            console.log("Toggle favorite with formulaId:", formula._id);
            
            const endpoint = isFavorite ? 
                'http://26.74.118.195:5000/users/remove-favorite' : 
                'http://26.74.118.195:5000/users/add-favorite';
            
            console.log("Calling endpoint:", endpoint);
            console.log("With token:", token.substring(0, 10) + "...");
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    formulaId: formula._id
                })
            });
            
            // Kiểm tra phản hồi trước khi parse JSON
            const textResponse = await response.text();
            console.log("Raw response:", textResponse.substring(0, 100) + "...");
            
            if (!response.ok) {
                console.error('Error response:', textResponse);
                Alert.alert('Lỗi', 'Không thể cập nhật trạng thái yêu thích');
                setSavingFavorite(false);
                return;
            }
            
            let data;
            try {
                data = JSON.parse(textResponse);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response was not valid JSON:', textResponse.substring(0, 200));
                Alert.alert('Lỗi', 'Phản hồi từ server không hợp lệ');
                setSavingFavorite(false);
                return;
            }
            
            // Update local user data to reflect changes in favorite count
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                const favoriteCount = isFavorite ? (user.favoriteFormulas - 1) : (user.favoriteFormulas + 1);
                const updatedUser = { ...user, favoriteFormulas: Math.max(0, favoriteCount) };
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            }
            
            // Toggle the favorite state
            setIsFavorite(!isFavorite);
            
            // Show success message
            Alert.alert(
                isFavorite ? 'Đã xóa' : 'Đã lưu', 
                isFavorite ? 'Đã xóa khỏi danh sách yêu thích' : 'Đã thêm vào danh sách yêu thích'
            );
        } catch (error) {
            console.error('Error toggling favorite:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái yêu thích. Vui lòng thử lại sau.');
        } finally {
            setSavingFavorite(false);
        }
    };

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

    // Custom renderer for LaTeX in markdown
    const renderLatex = (latexContent, index) => {
        const latexId = `latex-${index}`;
        
        // Create a sanitized version by first replacing backslashes properly
        let sanitizedLatex = latexContent
            .replace(/\\\\/g, "\\") // Convert double backslashes to single
            .replace(/\n/g, " ")    // Remove line breaks
            .trim();
            
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
                <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        background-color: white;
                        overflow: hidden;
                    }
                    .formula-container {
                        width: 100%;
                        padding: 8px;
                    }
                    .katex-display {
                        margin: 0;
                    }
                    .error {
                        color: red;
                        font-family: monospace;
                        padding: 10px;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="formula-container" id="formula"></div>
                <script>
                    document.addEventListener('DOMContentLoaded', function() {
                        try {
                            katex.render("${sanitizedLatex.replace(/"/g, '\\"')}", document.getElementById('formula'), {
                                throwOnError: false,
                                displayMode: true
                            });
                            
                            // Send height information back to React Native
                            setTimeout(() => {
                                const height = document.body.scrollHeight;
                                window.ReactNativeWebView.postMessage(JSON.stringify({height: height, id: "${latexId}"}));
                            }, 300);
                        } catch (e) {
                            document.getElementById('formula').innerHTML = '<div class="error">Error rendering formula</div>';
                            window.ReactNativeWebView.postMessage(JSON.stringify({height: 50, id: "${latexId}"}));
                        }
                    });
                </script>
            </body>
            </html>
        `;
        
        const handleWebViewMessage = (event) => {
            try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.id === latexId) {
                    setLatexHeights(prev => ({ ...prev, [latexId]: data.height }));
                }
            } catch (e) {
                console.error('Error parsing WebView message:', e);
            }
        };
        
        return (
            <WebView
                ref={ref => { webViewRefs.current[latexId] = ref; }}
                key={latexId}
                originWhitelist={['*']}
                source={{ html }}
                style={[
                    styles.inlineLatex, 
                    { height: latexHeights[latexId] || 100 }
                ]}
                scrollEnabled={false}
                onMessage={handleWebViewMessage}
                javaScriptEnabled={true}
            />
        );
    };

    // Parse content to extract and render LaTeX within markdown
    const renderMarkdownWithLatex = (content) => {
        if (!content) return null;
        
        // Extract content between $$ $$ and store for later rendering
        const parts = [];
        let lastIndex = 0;
        const regex = /\$\$(.*?)\$\$/gs;
        let match;

        while ((match = regex.exec(content)) !== null) {
            // Add text before LaTeX
            if (match.index > lastIndex) {
                parts.push({
                    type: 'markdown',
                    content: content.substring(lastIndex, match.index)
                });
            }
            
            // Add LaTeX
            parts.push({
                type: 'latex',
                content: match[1]
            });
            
            lastIndex = match.index + match[0].length;
        }
        
        // Add remaining text
        if (lastIndex < content.length) {
            parts.push({
                type: 'markdown',
                content: content.substring(lastIndex)
            });
        }

        return (
            <>
                {parts.map((part, index) => 
                    part.type === 'latex' 
                        ? <View key={`latex-container-${index}`} style={styles.latexContainer}>
                            {renderLatex(part.content, index)}
                          </View>
                        : <Markdown key={`markdown-${index}`} style={markdownStyles}>{part.content}</Markdown>
                )}
            </>
        );
    };

    // Format answer text to be more readable with line breaks
    const formatAnswerText = (text) => {
        if (!text) return '';
        
        // First replace literal "\n" with actual newlines
        let formatted = text.replace(/\\n/g, '\n')
        
        // Then continue with existing formatting...
        .replace(/([.!?])\s+/g, '$1\n\n')
        // Add line breaks after numbered steps (like "1.", "2.", etc.)
        .replace(/(\d+\.\s*[^.!?]*[.!?])/g, '$1\n\n')
        // Add line breaks after bullet points
        .replace(/(-\s+[^.!?]*[.!?])/g, '$1\n\n')
        // Fix any excessive line breaks
        .replace(/\n{3,}/g, '\n\n');
        
        return formatted;
    };

    const generateExample = async () => {
        setLoading(true);
        setExample(null);
        setShowAnswer(false);
        
        try {
            const prompt = `Tạo một ví dụ ngẫu nhiên liên quan đến công thức toán học: "${formula.title} - ${formula.description}". 
            Công thức LaTeX: ${formula.latex}. 
            Hãy cung cấp một bài toán thực tế sử dụng công thức này và cả lời giải chi tiết.
            
            Định dạng phản hồi như sau:
            {
              "example": "Nội dung ví dụ...", 
              "answer": "Đáp án và cách giải..."
            }
            
            QUAN TRỌNG: Trong phần "answer", hãy sử dụng văn bản thông thường để trình bày đáp án và cách giải. 
            KHÔNG sử dụng LaTeX hay Markdown đặc biệt. Hãy viết tất cả các công thức, phép tính dưới dạng văn bản đơn giản 
            (ví dụ: "Phân số 1/2", "Căn bậc hai của 4", "x mũ 2", "a cộng b", v.v.) để người đọc dễ hiểu.
            
            Trả lời CHÍNH XÁC theo cấu trúc JSON trên, không thêm văn bản nào khác.`;
            
            const response = await fetch(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBWyVKa3tLv3rLKdH-S46d_rb9oVIymttk",
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }]
                    })
                }
            );
            
            const data = await response.json();
            
            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                const responseText = data.candidates[0].content.parts[0].text;
                console.log('Raw response:', responseText);
                
                try {
                    // Try direct JSON parsing first
                    if (responseText.trim().startsWith('{') && responseText.trim().endsWith('}')) {
                        try {
                            const cleanedJson = responseText.replace(/(\r\n|\n|\r)/gm, " ").trim();
                            const parsedExample = JSON.parse(cleanedJson);
                            if (parsedExample.example && parsedExample.answer) {
                                setExample(parsedExample);
                                return;
                            }
                        } catch (e) {
                            console.log('Direct parsing failed, trying alternative methods');
                        }
                    }
                    
                    // Try to extract JSON from markdown code blocks or text
                    let jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/s) || 
                                    responseText.match(/\{[\s\S]*"example"[\s\S]*"answer"[\s\S]*\}/);
                    
                    if (jsonMatch) {
                        const jsonContent = jsonMatch[1] || jsonMatch[0];
                        // Clean up the extracted JSON
                        const cleanJsonStr = jsonContent
                            .replace(/(\r\n|\n|\r)/gm, " ") // Remove line breaks
                            .replace(/'/g, '"') // Replace single quotes with double quotes
                            .replace(/,\s*}/g, '}') // Remove trailing commas
                            .replace(/\\/g, '\\\\') // Escape backslashes
                            .replace(/\*/g, '\\*') // Escape asterisks
                            .replace(/\^/g, '\\^') // Escape carets
                            .replace(/\{/g, '\\{') // Escape curly braces
                            .replace(/\}/g, '\\}') // Escape curly braces
                            .replace(/\_/g, '\\_'); // Escape underscores
                            
                        try {
                            const parsedExample = JSON.parse(cleanJsonStr);
                            // Unescape the content after parsing
                            parsedExample.example = parsedExample.example
                                .replace(/\\\*/g, '*')
                                .replace(/\\\^/g, '^')
                                .replace(/\\\{/g, '{')
                                .replace(/\\\}/g, '}')
                                .replace(/\\\_/g, '_');
                            parsedExample.answer = parsedExample.answer
                                .replace(/\\\*/g, '*')
                                .replace(/\\\^/g, '^')
                                .replace(/\\\{/g, '{')
                                .replace(/\\\}/g, '}')
                                .replace(/\\\_/g, '_');
                            setExample(parsedExample);
                        } catch (parseError) {
                            console.error('Error parsing extracted JSON:', parseError);
                            // Fallback to manual extraction
                            const exampleMatch = responseText.match(/example["\s:]+([^"]+)/i) || 
                                               responseText.match(/example["\s:]+(.+?)(?:answer|$)/is);
                            const answerMatch = responseText.match(/answer["\s:]+([^"]+)/i) || 
                                              responseText.match(/answer["\s:]+(.+?)(?:$)/is);
                            
                            if (exampleMatch && answerMatch) {
                                setExample({
                                    example: exampleMatch[1].trim(),
                                    answer: answerMatch[1].trim()
                                });
                            }
                        }
                    } else {
                        // Manual extraction as fallback
                        const exampleMatch = responseText.match(/example["\s:]+([^"]+)/i) || 
                                           responseText.match(/example["\s:]+(.+?)(?:answer|$)/is);
                        const answerMatch = responseText.match(/answer["\s:]+([^"]+)/i) || 
                                          responseText.match(/answer["\s:]+(.+?)(?:$)/is);
                        
                        if (exampleMatch && answerMatch) {
                            setExample({
                                example: exampleMatch[1].trim(),
                                answer: answerMatch[1].trim()
                            });
                        } else {
                            // Create structured content from the whole response
                            let textParts = responseText.split(/Đáp án|Answer|Solution|Giải|Lời giải/i);
                            if (textParts.length >= 2) {
                                setExample({
                                    example: textParts[0].trim(),
                                    answer: textParts.slice(1).join('\n').trim()
                                });
                            } else {
                                setExample({
                                    example: "Ví dụ:",
                                    answer: responseText
                                });
                            }
                        }
                    }
                } catch (parseError) {
                    console.error('Error parsing example:', parseError);
                    // Create a more useful fallback
                    let textParts = responseText.split(/Đáp án|Answer|Solution|Giải|Lời giải/i);
                    if (textParts.length >= 2) {
                        setExample({
                            example: textParts[0].trim(),
                            answer: textParts.slice(1).join('\n').trim()
                        });
                    } else {
                        setExample({
                            example: "Ví dụ bài toán:",
                            answer: responseText
                        });
                    }
                }
            } else {
                setExample({
                    example: "Không thể tạo ví dụ. Vui lòng thử lại sau.",
                    answer: "Lỗi API"
                });
            }
        } catch (error) {
            console.error('Error generating example:', error);
            setExample({
                example: "Có lỗi khi kết nối với API. Vui lòng thử lại sau.",
                answer: "Lỗi kết nối"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={22} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.header}>{t('formula_details')}</Text>
                <TouchableOpacity 
                    style={styles.favoriteBtn}
                    onPress={toggleFavorite}
                    disabled={savingFavorite}
                >
                    {savingFavorite ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                        <Icon 
                            name={isFavorite ? "heart" : "heart-o"} 
                            size={22} 
                            color={isFavorite ? "#ff4081" : COLORS.primary} 
                        />
                    )}
                </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.contentScroll}>
                <View style={styles.content}>
                    <Text style={styles.title}>{formula.title}</Text>
                    
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('description')}</Text>
                        <Text style={styles.description}>{formula.description}</Text>
                    </View>
                    
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('formula')}</Text>
                        <View style={styles.formulaContainer}>
                            <WebView
                                originWhitelist={['*']}
                                source={{ html: getLatexHtml(formula.latex) }}
                                style={styles.webView}
                                scrollEnabled={false}
                                onLoad={() => {}}
                            />
                        </View>
                    </View>
                    
                    <TouchableOpacity 
                        style={styles.generateButton} 
                        onPress={generateExample}
                        disabled={loading}
                    >
                        <Text style={styles.generateButtonText}>
                            {example ? t('generate_new_example') : t('generate_random_example')}
                        </Text>
                    </TouchableOpacity>
                    
                    {loading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                            <Text style={styles.loadingText}>{t('generating_example')}</Text>
                        </View>
                    )}
                    
                    {example && !loading && (
                        <View style={styles.exampleSection}>
                            <Text style={styles.exampleTitle}>{t('example')}</Text>
                            <Text style={styles.exampleText}>{example.example}</Text>
                            
                            <TouchableOpacity 
                                style={styles.answerToggle} 
                                onPress={() => setShowAnswer(!showAnswer)}
                            >
                                <Text style={styles.answerToggleText}>
                                    {showAnswer ? t('hide_answer') : t('show_answer')}
                                </Text>
                                <Icon 
                                    name={showAnswer ? "eye-slash" : "eye"} 
                                    size={18} 
                                    color={COLORS.primary} 
                                    style={styles.answerIcon}
                                />
                            </TouchableOpacity>
                            
                            {showAnswer && (
                                <View style={styles.answerContainer}>
                                    <Text style={styles.answerTitle}>{t('answer')}</Text>
                                    <Text style={styles.answerText}>
                                        {formatAnswerText(example.answer)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

// Markdown styling
const markdownStyles = {
    body: {
        color: '#444',
        fontSize: 15,
    },
    heading1: {
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 10,
        color: '#333',
    },
    heading2: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 8,
        color: '#444',
    },
    heading3: {
        fontSize: 16,
        fontWeight: 'bold',
        marginVertical: 6,
        color: '#555',
    },
    paragraph: {
        marginVertical: 6,
        lineHeight: 22,
    },
    list_item: {
        marginVertical: 4,
        flexDirection: 'row',
    },
    bullet_list: {
        marginLeft: 20,
    },
    ordered_list: {
        marginLeft: 20,
    },
    code_block: {
        backgroundColor: '#f5f5f5',
        padding: 10,
        borderRadius: 4,
        fontFamily: 'monospace',
        marginVertical: 8,
    },
    code_inline: {
        backgroundColor: '#f5f5f5',
        fontFamily: 'monospace',
        padding: 2,
        borderRadius: 3,
    },
    blockquote: {
        borderLeftWidth: 4,
        borderLeftColor: '#ddd',
        paddingLeft: 10,
        marginVertical: 8,
        fontStyle: 'italic',
    },
    link: {
        color: COLORS.primary,
        textDecorationLine: 'underline',
    },
    image: {
        width: '100%',
        height: 200,
        resizeMode: 'contain',
        marginVertical: 8,
    },
    table: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        marginVertical: 10,
    },
    tr: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    th: {
        padding: 8,
        fontWeight: 'bold',
        backgroundColor: '#f5f5f5',
    },
    td: {
        padding: 8,
    },
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backBtn: {
        marginRight: 10,
        padding: 4,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.textDark,
        flex: 1,
    },
    favoriteBtn: {
        padding: 8,
        borderRadius: 20,
    },
    contentScroll: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textDark,
        marginBottom: 16,
    },
    section: {
        marginBottom: 24,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primaryDark,
        marginBottom: 8,
    },
    description: {
        fontSize: 15,
        color: COLORS.textDark,
        lineHeight: 22,
    },
    formulaContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 10,
        marginTop: 8,
    },
    webView: {
        height: 150,
        width: '100%',
        backgroundColor: 'white',
    },
    latexContainer: {
        marginVertical: 8,
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 4,
        overflow: 'hidden',
    },
    inlineLatex: {
        height: 100,
        width: '100%',
        backgroundColor: 'white',
    },
    generateButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginBottom: 24,
    },
    generateButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    loadingContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    loadingText: {
        marginTop: 8,
        color: '#666',
        fontSize: 14,
    },
    exampleSection: {
        backgroundColor: COLORS.lightGreen,
        borderRadius: 10,
        padding: 16,
        marginBottom: 24,
    },
    exampleTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    exampleText: {
        fontSize: 15,
        color: '#444',
        lineHeight: 22,
    },
    answerToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        padding: 10,
        backgroundColor: '#f0f8f0',
        borderRadius: 8,
    },
    answerToggleText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 15,
    },
    answerIcon: {
        marginLeft: 8,
    },
    answerContainer: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
    },
    answerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    answerText: {
        fontSize: 15,
        color: '#444',
        lineHeight: 22,
    },
});

export default FormulaDetailScreen; 