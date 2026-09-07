import { useEffect, useState, useRef, useCallback } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { useAuthStore } from '@/stores/auth-store';
import type { MessageDto, ChatRecordDto } from '@/types/chat';
import { useNotify } from '@/hooks/useNotify';

interface MemberChatWindowProps {
  chatRecordId: number;
  onBack: () => void;
}

function getSenderDisplay(message: MessageDto, currentUserId: string) {
  if (message.senderUserId === currentUserId) {
    return { name: '我', isMe: true };
  }
  if (message.senderType === 'admin') {
    return { name: message.senderUserName ?? '管理員', isMe: false };
  }
  return { name: message.senderMemberName ?? '會員', isMe: false };
}

function getChatTitle(chat: ChatRecordDto | undefined): string {
  if (!chat) return '聊天';
  if (chat.type === 1) {
    return `${chat.initiatorMemberName ?? '會員'} ↔ ${chat.targetMemberName ?? '會員'}`;
  }
  return chat.initiatorMemberName ?? chat.targetMemberName ?? '會員';
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const MemberChatWindow = ({ chatRecordId, onBack }: MemberChatWindowProps) => {
  const {
    memberMessages,
    chatList,
    typingIndicators,
    fetchMemberMessages,
    sendMemberMessage,
    sendTypingIndicator,
    markMemberAsRead,
    leaveChat,
  } = useChatStore();

  const { user } = useAuthStore();
  const currentUserId = user?.id ?? '';
  const DEFAULT_AVATAR = '/api/FileManagement/865c35a0-38a2-46fd-8f48-a54920f6fc20/download';
  const myAvatarUrl = user?.avatarUrl ?? DEFAULT_AVATAR;

  const notify = useNotify();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const conversationMessages = memberMessages[chatRecordId] || [];
  const chat = chatList.find((c) => c.id === chatRecordId);
  const typingType = typingIndicators[chatRecordId];
  const title = getChatTitle(chat);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try { await fetchMemberMessages(chatRecordId); } finally { setIsLoading(false); }
    };
    load();
  }, [chatRecordId, fetchMemberMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  useEffect(() => {
    markMemberAsRead(chatRecordId);
  }, [chatRecordId, markMemberAsRead]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    setIsSending(true);
    try {
      await sendMemberMessage(chatRecordId, inputValue);
      setInputValue('');
    } catch {
      await notify.error('發送失敗，請稍後再試');
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
      if (!typingTimeoutRef.current) {
        sendTypingIndicator(chatRecordId);
        typingTimeoutRef.current = setTimeout(() => {
          typingTimeoutRef.current = null;
        }, 2000);
      }
    },
    [chatRecordId, sendTypingIndicator]
  );

  return (
    <div className="flex flex-col h-full">
      {notify.NotifyComponent}
      <div className="p-3 border-b border-base-300 flex items-center gap-3">
        <button onClick={onBack} className="btn btn-ghost btn-sm btn-circle">
          <span className="iconify lucide--arrow-left size-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{title}</h3>
          <div className="flex items-center gap-1 flex-wrap">
            {chat && (
              <span className={`badge badge-xs ${chat.type === 1 ? 'badge-info' : 'badge-warning'}`}>
                {chat.type === 1 ? '會員媒合' : '會員諮詢'}
              </span>
            )}
            {chat?.initiatorMemberRole === 1 && <span className="badge badge-xs badge-success">供給端</span>}
            {chat?.initiatorMemberRole === 2 && <span className="badge badge-xs badge-accent">需求端</span>}
            {chat?.initiatorCompanyName && (
              <span className="badge badge-xs badge-outline">{chat.initiatorCompanyName}</span>
            )}
          </div>
        </div>
        {chat && chat.type === 2 && chat.status === 1 && chat.targetUserId === currentUserId && (
          <button
            className="btn btn-ghost btn-sm text-error"
            onClick={() => {
              if (confirm('確定要離開此聊天嗎？聊天將回到待領收池。')) {
                leaveChat(chatRecordId);
              }
            }}
          >
            <span className="iconify lucide--log-out size-4" />
            離開
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : conversationMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-base-content/60">
            <span className="iconify lucide--message-circle size-12 mb-2" />
            <p>尚無訊息</p>
          </div>
        ) : (
          <>
            {conversationMessages.map((message) => {
              const sender = getSenderDisplay(message, currentUserId);

              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${sender.isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {!sender.isMe && (
                    <div className="avatar placeholder">
                      <div className="bg-neutral text-neutral-content rounded-full w-8 h-8">
                        {message.senderAvatarUrl ? (
                          <img src={message.senderAvatarUrl} alt={sender.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className="text-xs">
                            {message.senderType === 'admin' ? '管' : sender.name.charAt(0)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[70%] ${sender.isMe ? 'items-end' : 'items-start'}`}>
                    <div className="text-xs text-base-content/60 mb-1 px-1">{sender.name}</div>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        sender.isMe
                          ? 'bg-primary text-primary-content rounded-br-sm'
                          : 'bg-base-200 text-base-content rounded-bl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-xs text-base-content/60">{formatTime(message.createdTime)}</span>
                      {sender.isMe && message.isRead && (
                        <span className="text-xs text-success">已讀</span>
                      )}
                    </div>
                  </div>

                  {sender.isMe && (
                    <div className="avatar">
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <img src={myAvatarUrl} alt="我" className="w-full h-full object-cover"  />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {typingType && (
              <div className="flex items-center gap-2 text-base-content/60">
                <span className="loading loading-dots loading-xs" />
                <span className="text-sm">
                  {typingType === 'member' ? '會員' : '管理員'}正在輸入...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="p-4 border-t border-base-300">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="輸入訊息..."
            className="textarea textarea-bordered flex-1 resize-none"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={isSending || !inputValue.trim()}
            className="btn btn-primary"
          >
            {isSending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <span className="iconify lucide--send size-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
