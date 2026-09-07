import { useState } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { useAuthStore } from '@/stores/auth-store';
import type { ChatRecordDto } from '@/types/chat';

interface MemberConversationListProps {
  onSelect: (chatRecordId: number) => void;
}

function getRoleLabel(role?: number): { text: string; className: string } | null {
  if (role === 1) return { text: '供給端', className: 'badge-success' };
  if (role === 2) return { text: '需求端', className: 'badge-accent' };
  return null;
}

function getCounterpart(chat: ChatRecordDto, currentUserId: string) {
  if (chat.type === 1) {
    return {
      name: `${chat.initiatorMemberName ?? '會員'} ↔ ${chat.targetMemberName ?? '會員'}`,
      badge: '會員媒合',
      badgeClass: 'badge-info',
      avatar: '媒',
    };
  }

  const isMeInitiator = chat.initiatorUserId === currentUserId;
  const isMeTarget = chat.targetUserId === currentUserId;

  if (isMeInitiator || isMeTarget) {
    const memberName = chat.initiatorMemberName ?? chat.targetMemberName ?? '會員';
    return {
      name: memberName,
      badge: '會員諮詢',
      badgeClass: 'badge-warning',
      avatar: memberName.charAt(0),
    };
  }

  return {
    name: chat.initiatorMemberName ?? chat.targetMemberName ?? '未知',
    badge: '',
    badgeClass: '',
    avatar: '?',
  };
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '剛剛';
  if (minutes < 60) return `${minutes}分鐘前`;
  if (hours < 24) return `${hours}小時前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-TW');
}

export const MemberConversationList = ({ onSelect }: MemberConversationListProps) => {
  const { chatList, waitingChats, isLoading, activeChatId, claimChat } = useChatStore();
  const { user } = useAuthStore();
  const currentUserId = user?.id ?? '';

  const [waitingOpen, setWaitingOpen] = useState(true);
  const [activeOpen, setActiveOpen] = useState(true);
  const [closedOpen, setClosedOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  const activeChats = chatList.filter((c) => c.type !== 2 || c.status === 1);
  const closedChats = chatList.filter((c) => c.type === 2 && c.status === 2);

  const renderChat = (chat: ChatRecordDto) => {
    const counterpart = getCounterpart(chat, currentUserId);
    const isActive = activeChatId === chat.id;

    return (
      <button
        key={chat.id}
        onClick={() => onSelect(chat.id)}
        className={`w-full p-3 border-b border-base-300 text-left transition-colors ${
          isActive ? 'bg-primary/10' : 'hover:bg-base-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-10">
              <span className="text-sm">{counterpart.avatar}</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="font-semibold text-sm text-base-content truncate">
                  {counterpart.name}
                </span>
                {counterpart.badge && (
                  <span className={`badge badge-xs ${counterpart.badgeClass}`}>
                    {counterpart.badge}
                  </span>
                )}
                {(() => {
                  const role = getRoleLabel(chat.initiatorMemberRole);
                  return role ? (
                    <span className={`badge badge-xs ${role.className}`}>{role.text}</span>
                  ) : null;
                })()}
                {chat.initiatorCompanyName && (
                  <span className="badge badge-xs badge-outline">{chat.initiatorCompanyName}</span>
                )}
              </div>
              <span className="text-xs text-base-content/60 shrink-0">
                {chat.lastMessage
                  ? formatTime(chat.lastMessage.createdTime)
                  : formatTime(chat.createdTime)}
              </span>
            </div>
            {chat.lastMessage ? (
              <p className={`text-sm truncate ${chat.unreadCount > 0 ? 'font-semibold text-base-content' : 'text-base-content/70'}`}>
                {chat.lastMessage.senderType === 'admin' && '我: '}
                {chat.lastMessage.text}
              </p>
            ) : (
              <p className="text-sm text-base-content/60 truncate">尚無訊息</p>
            )}
          </div>

          {chat.unreadCount > 0 && (
            <div className="badge badge-error badge-sm">
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </div>
          )}
        </div>
      </button>
    );
  };

  const renderWaitingChat = (chat: ChatRecordDto) => {
    const memberName = chat.initiatorMemberName ?? '會員';

    return (
      <div
        key={chat.id}
        className="w-full p-3 border-b border-base-300 flex items-center gap-3"
      >
        <div className="avatar placeholder">
          <div className="bg-warning text-warning-content rounded-full w-10">
            <span className="text-sm">{memberName.charAt(0)}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-semibold text-sm truncate">{memberName}</span>
            {(() => {
              const role = getRoleLabel(chat.initiatorMemberRole);
              return role ? (
                <span className={`badge badge-xs ${role.className}`}>{role.text}</span>
              ) : null;
            })()}
            {chat.initiatorCompanyName && (
              <span className="badge badge-xs badge-outline">{chat.initiatorCompanyName}</span>
            )}
          </div>
          <p className="text-xs text-base-content/60">
            {chat.lastMessage?.text ?? '等待客服...'}
          </p>
        </div>

        <button
          className="btn btn-sm btn-primary"
          onClick={(e) => {
            e.stopPropagation();
            claimChat(chat.id);
          }}
        >
          領收
        </button>
      </div>
    );
  };

  const hasAnyContent = waitingChats.length > 0 || chatList.length > 0;

  if (!hasAnyContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-base-content/60">
        <span className="iconify lucide--inbox size-16 mb-4" />
        <p>尚無聊天記錄</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* 待領收 */}
      <div className="collapse collapse-arrow bg-base-100 rounded-none border-b border-base-300">
        <input type="checkbox" checked={waitingOpen} onChange={() => setWaitingOpen(!waitingOpen)} />
        <div className="collapse-title text-sm font-semibold py-2 min-h-0 flex items-center gap-2">
          <span className="iconify lucide--clock text-warning size-4" />
          待領收 ({waitingChats.length})
          {waitingChats.length > 0 && (
            <span className="badge badge-error badge-xs animate-pulse" />
          )}
        </div>
        <div className="collapse-content !p-0">
          {waitingChats.length === 0 ? (
            <p className="text-sm text-base-content/60 p-3">目前沒有待領收聊天</p>
          ) : (
            waitingChats.map(renderWaitingChat)
          )}
        </div>
      </div>

      {/* 進行中 */}
      <div className="collapse collapse-arrow bg-base-100 rounded-none border-b border-base-300">
        <input type="checkbox" checked={activeOpen} onChange={() => setActiveOpen(!activeOpen)} />
        <div className="collapse-title text-sm font-semibold py-2 min-h-0">
          <span className="iconify lucide--message-circle text-success size-4 inline-block mr-1" />
          進行中 ({activeChats.length})
        </div>
        <div className="collapse-content !p-0">
          {activeChats.length === 0 ? (
            <p className="text-sm text-base-content/60 p-3">目前沒有進行中的聊天</p>
          ) : (
            activeChats.map(renderChat)
          )}
        </div>
      </div>

      {/* 已結束 */}
      {closedChats.length > 0 && (
        <div className="collapse collapse-arrow bg-base-100 rounded-none border-b border-base-300">
          <input type="checkbox" checked={closedOpen} onChange={() => setClosedOpen(!closedOpen)} />
          <div className="collapse-title text-sm font-semibold py-2 min-h-0">
            <span className="iconify lucide--archive text-base-content/50 size-4 inline-block mr-1" />
            已結束 ({closedChats.length})
          </div>
          <div className="collapse-content !p-0">
            {closedChats.map(renderChat)}
          </div>
        </div>
      )}
    </div>
  );
};
