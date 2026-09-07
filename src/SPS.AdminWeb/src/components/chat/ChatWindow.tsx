import { useEffect, useState, useRef } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { useAuthStore } from '@/stores/auth-store';
import { useNotify } from '@/hooks/useNotify';

interface ChatWindowProps {
  sessionId: string;
  onBack: () => void;
}

export const ChatWindow = ({ sessionId, onBack }: ChatWindowProps) => {
  const { visitorMessages, fetchChatHistory, sendVisitorMessage } = useChatStore();
  const { user } = useAuthStore();
  const DEFAULT_AVATAR = '/api/FileManagement/865c35a0-38a2-46fd-8f48-a54920f6fc20/download';
  const myAvatarUrl = user?.avatarUrl ?? DEFAULT_AVATAR;
  const notify = useNotify();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const conversationMessages = visitorMessages[sessionId] || [];

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await fetchChatHistory(sessionId);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [sessionId, fetchChatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    setIsSending(true);
    try {
      await sendVisitorMessage(sessionId, inputValue);
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full">
      {notify.NotifyComponent}
      <div className="p-3 border-b border-base-300">
        <button onClick={onBack} className="btn btn-ghost btn-sm gap-2">
          <span className="iconify lucide--arrow-left size-4" />
          返回列表
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : (
          <>
            {conversationMessages.map((message) => {
              const isAgent = message.senderType === 'agent';
              const isVisitor = message.senderType === 'visitor';
              const isMe = isAgent && message.senderId === user?.id;
              const avatarUrl = isMe
                ? myAvatarUrl
                : (message.senderAvatarUrl ?? null);

              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMe && (
                    <div className="avatar">
                      {avatarUrl ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                          <img src={avatarUrl} alt={message.senderName} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="bg-neutral text-neutral-content rounded-full w-8 h-8 placeholder">
                          <span className="text-xs">{isVisitor ? '訪' : '客'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="text-xs text-base-content/60 mb-1 px-1">
                      {isMe ? '我' : (message.senderName || (isAgent ? '客服' : '訪客'))}
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isMe
                          ? 'bg-primary text-primary-content rounded-br-sm'
                          : isAgent
                            ? 'bg-secondary text-secondary-content rounded-bl-sm'
                            : 'bg-base-200 text-base-content rounded-bl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    <span className="text-xs text-base-content/60 mt-1 px-1">
                      {message.createdTime ? formatTime(message.createdTime) : ''}
                    </span>
                  </div>

                  {isMe && (
                    <div className="avatar">
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <img src={myAvatarUrl} alt="我" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="p-4 border-t border-base-300">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
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
