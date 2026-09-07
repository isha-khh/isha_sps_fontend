using System.Text;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using SPS.Api.Attributes;
using SPS.Api.Middleware;
using SPS.Api.Services;
using SPS.Application.Interfaces.IServices;
using SPS.Application;
using SPS.Infrastructure;
using SPS.Infrastructure.Data;
using SPS.Infrastructure.Interceptors;

var builder = WebApplication.CreateBuilder(args);

// 設定 Kestrel 最大請求 Body 大小 (100MB，對應 Nginx client_max_body_size)
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 100 * 1024 * 1024; // 100MB
});

// 設定 Form Options 最大 Multipart Body 大小
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 100 * 1024 * 1024; // 100MB
});

// Add HttpContextAccessor (for AuditLogInterceptor)
builder.Services.AddHttpContextAccessor();

// Add AuditLog Interceptor
builder.Services.AddScoped<AuditLogInterceptor>();

// Add Infrastructure Layer (包含 DbContext、Repositories、Services)
builder.Services.AddInfrastructure(builder.Configuration);

// Add Application Layer (包含業務邏輯服務)
builder.Services.AddApplication();

// Add API-layer services
builder.Services.AddScoped<IExcelExportService, ExcelExportService>();

// Add JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["JWT_Setting:Key"]
                    ?? throw new InvalidOperationException("JWT Key not configured"))),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["JWT_Setting:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["JWT_Setting:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        // 從 Cookie 中讀取 Token
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                string? token = null;

                // 根據路徑決定 Token 優先級
                if (context.Request.Path.StartsWithSegments("/api/admin"))
                {
                    // Admin 路由優先嘗試 adminAccessToken
                    if (!context.Request.Cookies.TryGetValue("adminAccessToken", out token))
                    {
                         // 嘗試 accessToken
                         context.Request.Cookies.TryGetValue("accessToken", out token);
                    }
                }
                else
                {
                    // 一般路由優先嘗試 accessToken
                    if (!context.Request.Cookies.TryGetValue("accessToken", out token))
                    {
                        // 嘗試 adminAccessToken (讓 Admin 也能訪問公共資源)
                        context.Request.Cookies.TryGetValue("adminAccessToken", out token);
                    }
                }

                if (!string.IsNullOrEmpty(token))
                {
                    context.Token = token;
                }

                // 如果 Cookie 中沒有，則從 Authorization Header 讀取（向後兼容）
                if (string.IsNullOrEmpty(context.Token) && context.Request.Headers.ContainsKey("Authorization"))
                {
                    var authHeader = context.Request.Headers["Authorization"].ToString();
                    if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                    {
                        context.Token = authHeader.Substring("Bearer ".Length).Trim();
                    }
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// Add Controllers with Action Filter
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ActionLogFilter>();
});

// Add SignalR
builder.Services.AddSignalR();

// Forwarded Headers (Nginx reverse proxy 轉發 HTTPS 資訊)
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

// Antiforgery Setting
if (!builder.Environment.IsDevelopment())
{
    builder.Services.AddAntiforgery(options =>
    {
        options.HeaderName = "X-CSRF-TOKEN";
        options.Cookie.Name = "sps-app";
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    });
}
else
{
    // 開發環境也建議加上，否則底下的 MapGet 會因為找不到服務而崩潰
    builder.Services.AddAntiforgery();
}


// Add CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            // 開發環境：允許所有 origins（但必須指定具體的 origin，不能用 AllowAnyOrigin）
            policy.SetIsOriginAllowed(origin => true)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
        else
        {
            // 生產環境：只允許指定的 origins
            var origins = builder.Configuration["CORS_Setting:WithOrigins"]?.Split(',')
                ?? new[] { "http://localhost:3000" };

            policy.WithOrigins(origins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    });
});

// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.EnableAnnotations();
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "SPS API",
        Version = "v1",
        Description = "智慧石化產業資訊暨媒合平台 API",
        Contact = new OpenApiContact
        {
            Name = "ISHA Foy",
            Email = "foylaou0326@mail.isha.org.tw"
        },

    });

    // 加載 XML 註解文件
    var xmlFilename = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }

    // 加載 Application 層的 XML 註解
    var applicationXmlPath = Path.Combine(AppContext.BaseDirectory, "SPS.Application.xml");
    if (File.Exists(applicationXmlPath))
    {
        c.IncludeXmlComments(applicationXmlPath);

    }

    // JWT 認證配置
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "請輸入 JWT Token（不需要加 Bearer 前綴，系統會自動添加）",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer"),
            new List<string>()
        }
    });
});

var app = builder.Build();

// 自動檢查並套用資料庫遷移
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();

    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();

        // 檢查是否有待執行的遷移
        var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
        var pendingList = pendingMigrations.ToList();

        if (pendingList.Count > 0)
        {
            logger.LogInformation("發現 {Count} 個待執行的資料庫遷移: {Migrations}",
                pendingList.Count, string.Join(", ", pendingList));

            logger.LogInformation("開始執行資料庫遷移...");
            await context.Database.MigrateAsync();
            logger.LogInformation("資料庫遷移完成");
        }
        else
        {
            logger.LogInformation("資料庫已是最新版本，無需遷移");
        }

        // 顯示目前已套用的遷移
        var appliedMigrations = await context.Database.GetAppliedMigrationsAsync();
        logger.LogInformation("目前已套用的遷移數量: {Count}", appliedMigrations.Count());
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "資料庫遷移時發生錯誤");
        throw; // 遷移失敗時中止啟動
    }
}

app.MapGet("api/antiforgery/token", (IAntiforgery antiforgery, HttpContext context) =>
{
    var tokens = antiforgery.GetAndStoreTokens(context);

    // 將 RequestToken 回傳給前端
    return Results.Ok(new { token = tokens.RequestToken });
});
// Configure the HTTP request pipeline

// Forwarded Headers 必須在所有中間件之前，讓後續中間件能正確識別 HTTPS
app.UseForwardedHeaders();

// 全局異常處理中間件
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "SPS API V1");
        c.RoutePrefix = string.Empty; // 設置 Swagger UI 為根路徑
        c.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.None); // 預設收合所有手風琴
    });

    // 只在開發環境啟用 HTTPS 重導向
    // 生產環境中 HTTPS 由前端 Load Balancer / Nginx 處理
    app.UseHttpsRedirection();
}

app.UseCors();

// 提供靜態檔案服務 (wwwroot)
app.UseStaticFiles();

// 認證和授權
app.UseAuthentication();
app.UseAuthorization();

// Health check endpoint
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "Healthy",
    timestamp = DateTime.UtcNow,
    version = "1.0.0",
    environment = app.Environment.EnvironmentName
})).AllowAnonymous();


// Map SignalR Hubs
app.MapHub<SPS.Api.Hubs.CustomerHub>("/hubs/customer");
app.MapHub<SPS.Api.Hubs.MemberHub>("/hubs/member");

app.MapControllers();

app.Run();
