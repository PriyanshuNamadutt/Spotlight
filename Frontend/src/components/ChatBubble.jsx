export default function ChatBubble({ role, text }) {
  const isUser = role === 'user';
  return (
    <div className={`chat-row ${isUser ? 'chat-row--user' : 'chat-row--ai'}`}>
      <div className={`chat-bubble ${isUser ? 'chat-bubble--user' : 'chat-bubble--ai'}`}>
        <span className="chat-role">{isUser ? 'You' : 'AI'}</span>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{text}</p>
      </div>
    </div>
  );
}
