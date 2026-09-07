import React, {useState, useEffect, useCallback} from "react";
import {Link, useNavigate} from 'react-router-dom'; // 確保引入 useNavigate

import {useAuthStore} from "@/stores/auth-store"; // 引入 Store
import {Logo} from "@/components/Logo";
import {MetaData} from "@/components/MetaData";
import {ThemeToggle} from "@/components/ThemeToggle";
import {ConfigProvider} from "@/contexts/config.tsx";
import {CaptchaInput} from "@/components/auth/CaptchaInput";
import type {CaptchaData} from "@/types/captcha";
import {adminAuthApi} from "@/lib/api/admin-auth";

const LoginPage = () => {
    // 狀態管理 (合併自 Code A 與 Code B)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingInit, setIsCheckingInit] = useState(true);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false); // 保留 Code B 的顯示密碼功能
    const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null);

    const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
    const [isPasskeyEnabled, setIsPasskeyEnabled] = useState(false);

    // Hooks
    const { login, loginWithPasskey, checkInit } = useAuthStore();
    const navigate = useNavigate();

    // 驗證碼變更回調
    const handleCaptchaChange = useCallback((data: CaptchaData | null) => {
        setCaptchaData(data);
    }, []);

    // 檢查系統初始化狀態 & Passkey 啟用狀態
    useEffect(() => {
        const checkSystemInit = async () => {
            try {
                const [initRes, fido2Res] = await Promise.all([
                    checkInit(),
                    adminAuthApi.fido2Status().catch(() => ({ enabled: false })),
                ]);

                if (initRes.init) {
                    navigate('/register');
                }

                setIsPasskeyEnabled(fido2Res.enabled);
            } catch (err) {
                console.error('檢查系統初始化狀態失敗:', err);
            } finally {
                setIsCheckingInit(false);
            }
        };

        checkSystemInit();
    }, [checkInit, navigate]);

    // 處理登入邏輯 (來自 Code A)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password, captchaData ?? undefined);
            navigate('/dashboard'); // 登入成功跳轉
        } catch (err: any) {
            const errorMessage = err?.response?.data?.error || err?.message || '登入失敗，請檢查帳號密碼';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // 正在檢查系統初始化狀態
    if (isCheckingInit) {
        return (
            <ConfigProvider>
                <MetaData title="系統初始化檢查" />
                <div className="flex h-screen items-center justify-center">
                    <div className="text-center">
                        <span className="loading loading-spinner loading-lg"></span>
                        <p className="mt-4 text-base-content/70">檢查系統狀態中...</p>
                    </div>
                </div>
            </ConfigProvider>
        );
    }

    return (
        <>
            <ConfigProvider>
                <MetaData title="後台管理系統登入"/>
                <div className="flex h-full flex-col items-stretch p-6 md:p-8 lg:p-16">
                    <div className="flex items-center justify-between">
                        <Link to="/dashboards/ecommerce">
                            <Logo/>
                        </Link>

                        <ThemeToggle className="btn btn-circle btn-outline border-base-300"/>
                    </div>
                    <div className="flex grow flex-col ">
                        <div className="grow-[1]"></div>
                        {/* 標題區域 (使用 Code A 的文字內容，配合 Code B 的樣式) */}
                        <h3 className="mt-8 text-center text-xl font-semibold md:mt-12 lg:mt-24">
                            後台管理系統登入
                        </h3>
                        <h3 className="text-base-content/70 mt-2 text-center text-sm">
                            智慧石化產業資訊暨媒合平台
                        </h3>

                        {/* Form 區域 */}
                        <form onSubmit={handleSubmit} className="mt-6 md:mt-10">

                            {/* Email 輸入框 */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">電子郵件</legend>
                                <label className="input w-full focus:outline-0">
                                    <span className="iconify lucide--mail text-base-content/80 size-5"></span>
                                    <input
                                        className="grow focus:outline-0"
                                        placeholder="請輸入電子郵件"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </label>
                            </fieldset>

                            {/* 密碼輸入框 */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">密碼</legend>
                                <label className="input w-full focus:outline-0">
                                    <span className="iconify lucide--key-round text-base-content/80 size-5"></span>
                                    <input
                                        className="grow focus:outline-0"
                                        placeholder="請輸入密碼"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    {/* 顯示/隱藏密碼按鈕 */}
                                    <button
                                        type="button" // 這裡要明確設為 button，避免觸發 submit
                                        className="btn btn-xs btn-ghost btn-circle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label="Toggle Password Visibility">
                                        {showPassword ? (
                                            <span className="iconify lucide--eye-off size-4"/>
                                        ) : (
                                            <span className="iconify lucide--eye size-4"/>
                                        )}
                                    </button>
                                </label>
                            </fieldset>

                            <div className="text-end">
                                <Link className="label-text text-base-content/80 text-xs" to="/forgot-password">
                                    忘記密碼？
                                </Link>
                            </div>

                            {/* 驗證碼 */}
                            <CaptchaInput
                                scenario="admin-login"
                                onChange={handleCaptchaChange}
                                disabled={isLoading}
                            />

                            {/* 錯誤訊息顯示區域 (新增) */}
                            {error && (
                                <div className="alert alert-error mt-4 p-2 text-sm">
                                    <span className="iconify lucide--alert-circle size-5"/>
                                    <span className="whitespace-pre-line">{error}</span>
                                </div>
                            )}



                            {/* 登入按鈕 (將 Link 改為 Button submit) */}
                            <button
                                type="submit"
                                className="btn btn-primary btn-wide mt-4 max-w-full gap-3 md:mt-6 w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"/>
                                        登入中...
                                    </>
                                ) : (
                                    <>
                                        <span className="iconify lucide--log-in size-4"/>
                                        登入
                                    </>
                                )}
                            </button>

                        </form>

                        {/* Passkey 登入 */}
                        {isPasskeyEnabled && <>
                        <div className="divider mt-4">或</div>
                        <button
                            type="button"
                            className="btn btn-outline btn-wide max-w-full gap-3 w-full"
                            disabled={isPasskeyLoading || isLoading}
                            onClick={async () => {
                                setError('');
                                setIsPasskeyLoading(true);
                                try {
                                    await loginWithPasskey();
                                    navigate('/dashboard');
                                } catch (err: any) {
                                    const msg = err?.name === 'NotAllowedError'
                                        ? '已取消或裝置不支援 Passkey'
                                        : err?.response?.data?.error || err?.message || 'Passkey 登入失敗';
                                    setError(msg);
                                } finally {
                                    setIsPasskeyLoading(false);
                                }
                            }}
                        >
                            {isPasskeyLoading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"/>
                                    驗證中...
                                </>
                            ) : (
                                <>
                                    <span className="iconify lucide--fingerprint size-5"/>
                                    使用 Passkey 登入
                                </>
                            )}
                        </button>
                        </>}

                        <div className="grow-[2]"></div>
                    </div>
                </div>
            </ConfigProvider>
        </>
    );
};

export default LoginPage;
