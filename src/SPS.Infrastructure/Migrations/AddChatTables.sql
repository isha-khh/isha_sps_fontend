-- ========================================
-- 聊天系統資料表 (PostgreSQL)
-- ========================================

-- 聊天消息表
CREATE TABLE IF NOT EXISTS "ChatMessages" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "SessionId" VARCHAR(200) NOT NULL,
    "SenderId" UUID NULL,
    "SenderType" VARCHAR(50) NOT NULL, -- 'visitor' 或 'agent'
    "SenderName" VARCHAR(200) NOT NULL,
    "Content" TEXT NOT NULL,
    "MessageType" VARCHAR(50) NOT NULL DEFAULT 'text',
    "IsRead" BOOLEAN NOT NULL DEFAULT FALSE,
    "ReadTime" TIMESTAMP NULL,
    "CreatedTime" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedTime" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 訪客會話表 (歷史記錄)
CREATE TABLE IF NOT EXISTS "UserSessions" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "SessionId" VARCHAR(200) NOT NULL UNIQUE,
    "ConnectionId" VARCHAR(200) NULL,
    "GaClientId" VARCHAR(200) NULL,
    "IsOnline" BOOLEAN NOT NULL DEFAULT TRUE,
    "FirstConnectedTime" TIMESTAMP NOT NULL,
    "LastActiveTime" TIMESTAMP NOT NULL,
    "DisconnectedTime" TIMESTAMP NULL,
    "UserAgent" TEXT NULL,
    "IpAddress" VARCHAR(100) NULL,
    "UtmTags" JSONB NULL,
    "Status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "CurrentUrl" TEXT NULL,
    "PageTitle" TEXT NULL,
    "CreatedTime" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UpdatedTime" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 訪客頁面瀏覽記錄
CREATE TABLE IF NOT EXISTS "VisitorPageViews" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "SessionId" VARCHAR(200) NOT NULL,
    "Url" TEXT NOT NULL,
    "Title" TEXT NULL,
    "ViewTime" TIMESTAMP NOT NULL,
    "DurationSeconds" INTEGER NULL,
    "ReferrerUrl" TEXT NULL,
    "CreatedTime" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 索引優化
CREATE INDEX IF NOT EXISTS "IX_ChatMessages_SessionId" ON "ChatMessages" ("SessionId");
CREATE INDEX IF NOT EXISTS "IX_ChatMessages_CreatedTime" ON "ChatMessages" ("CreatedTime");
CREATE INDEX IF NOT EXISTS "IX_ChatMessages_IsRead" ON "ChatMessages" ("IsRead");

CREATE INDEX IF NOT EXISTS "IX_UserSessions_SessionId" ON "UserSessions" ("SessionId");
CREATE INDEX IF NOT EXISTS "IX_UserSessions_IsOnline" ON "UserSessions" ("IsOnline");
CREATE INDEX IF NOT EXISTS "IX_UserSessions_LastActiveTime" ON "UserSessions" ("LastActiveTime");

CREATE INDEX IF NOT EXISTS "IX_VisitorPageViews_SessionId" ON "VisitorPageViews" ("SessionId");
CREATE INDEX IF NOT EXISTS "IX_VisitorPageViews_ViewTime" ON "VisitorPageViews" ("ViewTime");

-- 查詢範例
-- 獲取會話的所有消息
-- SELECT * FROM "ChatMessages" WHERE "SessionId" = 'visitor-xxx' ORDER BY "CreatedTime";

-- 獲取未讀消息數
-- SELECT COUNT(*) FROM "ChatMessages" WHERE "SessionId" = 'visitor-xxx' AND "IsRead" = FALSE AND "SenderType" = 'visitor';

-- 獲取訪客頁面瀏覽軌跡
-- SELECT * FROM "VisitorPageViews" WHERE "SessionId" = 'visitor-xxx' ORDER BY "ViewTime";
