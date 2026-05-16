'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Hello! I am QuickBill AI, your intelligent business assistant. I can help you write product descriptions, analyze your business, draft marketing emails, or give general advice. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages(prev => [...prev, { role: 'ai', content: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: `**Error:** ${data.error || 'Failed to connect to AI.'}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: '**Error:** Network issue occurred while contacting the AI.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--sidebar)' }}>
          AI Assistant
        </h1>
        <p style={{ color: 'var(--secondary)' }}>
          Powered by Google Gemini. Ask for advice, generate text, or analyze data.
        </p>
      </header>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'var(--background)' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              gap: '1rem', 
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-start'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'white',
                color: msg.role === 'user' ? 'white' : '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                border: msg.role === 'ai' ? '1px solid #e2e8f0' : 'none',
                flexShrink: 0
              }}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div 
                className={msg.role === 'ai' ? 'ai-message-content' : ''}
                style={{ 
                  maxWidth: '75%', 
                  padding: '1rem 1.25rem', 
                  borderRadius: '1rem',
                  backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'white',
                  color: msg.role === 'user' ? 'white' : 'var(--foreground)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  border: msg.role === 'ai' ? '1px solid #e2e8f0' : 'none',
                  borderTopRightRadius: msg.role === 'user' ? 0 : '1rem',
                  borderTopLeftRadius: msg.role === 'ai' ? 0 : '1rem',
                  lineHeight: 1.6,
                  overflowX: 'auto',
                }}>
                {msg.role === 'user' ? (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'white', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <Bot size={20} />
              </div>
              <div style={{ padding: '1rem', borderRadius: '1rem', backgroundColor: 'white', borderTopLeftRadius: 0, border: '1px solid #e2e8f0' }}>
                <Loader2 className="animate-spin text-primary" size={20} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', backgroundColor: 'white' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the AI assistant anything..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '1rem 1.5rem',
                borderRadius: '2rem',
                border: '1px solid var(--border)',
                outline: 'none',
                fontSize: '1rem',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                backgroundColor: '#f1f5f9'
              }}
              onFocus={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.borderColor = 'var(--primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
              }}
              onBlur={(e) => {
                if(!e.target.value) e.target.style.backgroundColor = '#f1f5f9';
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                backgroundColor: input.trim() && !isLoading ? 'var(--primary)' : '#94a3b8',
                color: 'white',
                border: 'none',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                boxShadow: input.trim() && !isLoading ? '0 4px 10px rgba(37,99,235,0.3)' : 'none'
              }}
              onMouseEnter={(e) => input.trim() && !isLoading && (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => input.trim() && !isLoading && (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Send size={20} style={{ marginLeft: '4px' }} />
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
            AI responses are generated by Gemini and may not always be 100% accurate.
          </div>
        </div>
      </div>

      <style jsx global>{`
        .ai-message-content p { margin-bottom: 0.75rem; }
        .ai-message-content p:last-child { margin-bottom: 0; }
        .ai-message-content strong { font-weight: 700; color: #1e293b; }
        .ai-message-content ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 0.75rem; }
        .ai-message-content ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 0.75rem; }
        .ai-message-content li { margin-bottom: 0.25rem; }
        .ai-message-content table { width: 100%; border-collapse: collapse; margin-bottom: 0.75rem; }
        .ai-message-content th, .ai-message-content td { border: 1px solid #e2e8f0; padding: 0.5rem; text-align: left; }
        .ai-message-content th { background-color: #f8fafc; font-weight: 600; }
        .ai-message-content code { background-color: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.875em; }
        .ai-message-content pre { background-color: #1e293b; color: #f8fafc; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin-bottom: 0.75rem; }
        .ai-message-content pre code { background-color: transparent; color: inherit; padding: 0; }
      `}</style>
    </div>
  );
}
