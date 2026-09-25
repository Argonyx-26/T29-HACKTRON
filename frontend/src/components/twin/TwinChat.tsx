import React, { useState } from 'react';
import { TwinMessage } from '../../types';

export const TwinChat: React.FC = () => {
  const [messages, setMessages] = useState<TwinMessage[]>([
    {
      id: 'm1',
      sender: 'twin',
      content:
        "Hello Alex! I am your AI Knowledge Twin. I've been tracking your understanding across Deep Learning and noticed you're exploring Attention Mechanisms. What would you like to explore today?",
      timestamp: 'Just now',
      suggestedActions: [
        { label: 'Why scale dot products by sqrt(d_k)?', action: 'explain_sqrt' },
        { label: 'Explain Backpropagation with an analogy', action: 'analogy_backprop' },
        { label: 'Test my knowledge on Activation Functions', action: 'quiz_activations' },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: TwinMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: text,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = "I understand your question! Based on your current mastery level, here is how we can think about this:";
      if (text.toLowerCase().includes('sqrt')) {
        reply = "When the dimension d_k is large, the dot products grow large in magnitude. When passed to softmax, this causes very steep probabilities and vanishing gradients. Dividing by sqrt(d_k) stabilizes the variance to 1, keeping gradient flow healthy!";
      } else if (text.toLowerCase().includes('backprop')) {
        reply = "Think of backpropagation like adjusting a team in a relay race: the coach looks at the final delay at the finish line and works backwards, telling each runner exactly how many milliseconds their stride contributed to the total error.";
      } else {
        reply = `Analyzing your cognitive model for: "${text}". Your foundational concepts are solid, but let's make sure you verify the edge conditions and prerequisite constraints!`;
      }

      const twinMsg: TwinMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'twin',
        content: reply,
        timestamp: 'Just now',
        suggestedActions: [
          { label: 'Give me a practice problem', action: 'practice' },
          { label: 'Show visual diagram', action: 'visual' },
        ],
      };

      setMessages((prev) => [...prev, twinMsg]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <div className="view-container twin-chat-view">
      <div className="view-header">
        <div>
          <h2>Cognitive Twin Socratic Dialog</h2>
          <p className="subtitle">Real-time conversational twin calibrated to your mental model &amp; mastery level</p>
        </div>
        <span className="badge badge-accent">⚡ Socratic Reasoning Mode</span>
      </div>

      <div className="chat-window card">
        <div className="chat-messages-container">
          {messages.map((m) => (
            <div key={m.id} className={`chat-message-wrapper ${m.sender}`}>
              <div className="chat-bubble">
                <div className="bubble-header">
                  <strong>{m.sender === 'twin' ? '🧠 Knowledge Twin' : 'You'}</strong>
                  <span className="timestamp">{m.timestamp}</span>
                </div>
                <p className="bubble-text">{m.content}</p>

                {m.suggestedActions && m.suggestedActions.length > 0 && (
                  <div className="suggested-chips">
                    {m.suggestedActions.map((s, idx) => (
                      <button
                        key={idx}
                        className="chip-btn"
                        onClick={() => sendMessage(s.label)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chat-message-wrapper twin">
              <div className="chat-bubble typing-bubble">
                <span>Twin is reasoning across your knowledge graph</span>
                <span className="dots-anim">...</span>
              </div>
            </div>
          )}
        </div>

        <form
          className="chat-input-row"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
        >
          <input
            type="text"
            className="input-field chat-input"
            placeholder="Ask your Cognitive Twin anything or request a tailored explanation..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={!input.trim()}>
            Send &rarr;
          </button>
        </form>
      </div>
    </div>
  );
};

export default TwinChat;
