import React from 'react';
import { Message, UserProfile } from '../../types/chat';
import styles from './Message.module.css'; // We'll create this CSS module

interface MessageItemProps {
  message: Message;
  currentUser: UserProfile | null;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, currentUser }) => {
  const isCurrentUser = currentUser?.id === message.user_id;
  const senderName = message.user?.username || 'Unknown User';
  const avatarUrl = message.user?.avatar_url || '/default-avatar.png'; // Ensure you have a default avatar in public folder

  return (
    <div 
      className={`${styles.messageItem} ${isCurrentUser ? styles.currentUser : styles.otherUser}`}
      title={`Sent by ${senderName} at ${new Date(message.created_at).toLocaleTimeString()}`}
    >
      <div className={styles.messageContent}>
        {!isCurrentUser && (
          <img src={avatarUrl} alt={senderName} className={styles.avatar} />
        )}
        <div className={styles.bubble}>
          {!isCurrentUser && <div className={styles.senderName}>{senderName}</div>}
          <p className={styles.text}>{message.content}</p>
          <div className={styles.timestamp}>
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        {isCurrentUser && (
          <img src={avatarUrl} alt={senderName} className={styles.avatar} />
        )}
      </div>
    </div>
  );
};

export default MessageItem;
