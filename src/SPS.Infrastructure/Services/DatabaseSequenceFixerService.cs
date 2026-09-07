using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SPS.Infrastructure.Data;

namespace SPS.Infrastructure.Services;

/// <summary>
/// 修復資料庫序列的背景服務
/// 解決 Identity Column 序列不同步導致的主鍵衝突問題
/// </summary>
public class DatabaseSequenceFixerService : IHostedService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DatabaseSequenceFixerService> _logger;

    public DatabaseSequenceFixerService(
        IServiceProvider serviceProvider,
        ILogger<DatabaseSequenceFixerService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("開始檢查並修復資料庫序列...");

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            // 修復所有可能有問題的表格序列
            await FixSequenceAsync(dbContext, "ActionLogs", "Id", cancellationToken);
            await FixSequenceAsync(dbContext, "Notifications", "Id", cancellationToken);
            await FixSequenceAsync(dbContext, "MailLogs", "Id", cancellationToken);

            _logger.LogInformation("資料庫序列檢查完成");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "修復資料庫序列時發生錯誤");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private async Task FixSequenceAsync(
        ApplicationDbContext dbContext,
        string tableName,
        string columnName,
        CancellationToken cancellationToken)
    {
        try
        {
            var sql = $@"
                DO $$
                DECLARE
                    max_id bigint;
                    current_val bigint;
                    seq_name text;
                BEGIN
                    -- 取得目前最大 ID
                    EXECUTE format('SELECT COALESCE(MAX(""{columnName}""), 0) FROM ""{tableName}""') INTO max_id;

                    -- 取得序列名稱
                    SELECT pg_get_serial_sequence('""{tableName}""', '{columnName}') INTO seq_name;

                    IF seq_name IS NOT NULL THEN
                        -- 取得目前序列值 (seq_name 已是 schema-qualified，不可再用 %I)
                        EXECUTE format('SELECT last_value FROM %s', seq_name) INTO current_val;

                        -- 只有當序列值小於等於最大 ID 時才需要修復
                        IF current_val <= max_id THEN
                            EXECUTE format('SELECT setval(%L, %s, true)', seq_name, max_id);
                            RAISE NOTICE '{tableName} sequence (%) reset from % to %', seq_name, current_val, max_id;
                        END IF;
                    ELSE
                        -- 對於 Identity Column，取得目前值並比較
                        BEGIN
                            EXECUTE format('ALTER TABLE ""{tableName}"" ALTER COLUMN ""{columnName}"" RESTART WITH %s', max_id + 1);
                            RAISE NOTICE '{tableName} identity column reset to %', max_id + 1;
                        EXCEPTION WHEN OTHERS THEN
                            -- 忽略錯誤，可能序列已經正確
                            NULL;
                        END;
                    END IF;
                END $$;
            ";

            await dbContext.Database.ExecuteSqlRawAsync(sql, cancellationToken);
            _logger.LogDebug("已檢查表格 {TableName} 的序列", tableName);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "檢查表格 {TableName} 序列時發生錯誤", tableName);
        }
    }
}
