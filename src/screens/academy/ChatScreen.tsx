import React, { useRef, useState } from 'react';
import { View, KeyboardAvoidingView, Platform, FlatList, ListRenderItem } from 'react-native';
import { TextInput, Button, Card, Text } from 'react-native-paper';
import { generateChatResponse } from '../../services/gemini';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ia';
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Função para enviar mensagem
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    try {
      const aiText = await generateChatResponse(userMessage.text);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        sender: 'ia',
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          text: 'Desculpe, não consegui processar sua pergunta. Tente novamente.',
          sender: 'ia',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Renderização de cada mensagem
  const renderItem: ListRenderItem<Message> = ({ item }) => (
    <View
      style={{
        alignSelf: item.sender === 'user' ? 'flex-end' : 'flex-start',
        maxWidth: '80%',
        marginVertical: 4,
      }}
    >
      <Card
        style={{
          backgroundColor: item.sender === 'user' ? '#E3F2FD' : '#F5F5F5',
          borderTopLeftRadius: item.sender === 'user' ? 16 : 4,
          borderTopRightRadius: item.sender === 'user' ? 4 : 16,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        }}
      >
        <Card.Content>
          <Text style={{ fontSize: 16 }}>{item.text}</Text>
        </Card.Content>
      </Card>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd?.({ animated: true })}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 8,
          borderTopWidth: 1,
          borderColor: '#eee',
          backgroundColor: '#fafafa',
        }}
      >
        <TextInput
          style={{ flex: 1, marginRight: 8, backgroundColor: '#fff' }}
          value={input}
          onChangeText={setInput}
          placeholder="Digite sua pergunta..."
          mode="outlined"
          onSubmitEditing={handleSendMessage}
          returnKeyType="send"
        />
        <Button mode="contained" onPress={handleSendMessage} disabled={!input.trim() || isTyping}>
          {isTyping ? 'IA respondendo...' : 'Enviar'}
        </Button>
      </View>
      {isTyping && (
        <Text style={{ textAlign: 'center', color: '#888', marginVertical: 8 }}>IA está digitando...</Text>
      )}
    </KeyboardAvoidingView>
  );
} 