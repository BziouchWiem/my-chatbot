'use client';

import { useState } from 'react';
import styles from './page.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: input },
    ];
    setMessages(newMessages); // Affiche le message utilisateur

    const payload = {
      messages: newMessages.map(m => ({
        role: m.role,
        content: m.content, // ✅ plus de `parts`
      })),
    };

    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let result = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value);
      }

      setMessages([...newMessages, { role: 'assistant', content: result }]);
    }

    setInput('');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Assistant de voyage</h1>

      <div className={styles.chatBox}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === 'user' ? styles.userMessage : styles.botMessage}
          >
            {m.content.split('\n').map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          className={styles.input}
          value={input}
          onChange={handleInputChange}
          placeholder="Posez-moi une question..."
        />
        <button className={styles.button} type="submit">
          Envoyer
        </button>
      </form>
    </div>
  );
}
