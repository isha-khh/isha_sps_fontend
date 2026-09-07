import React, { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';

import { useAuthStore } from "@/stores/auth-store";
import { Logo } from "@/components/Logo";
import { MetaData } from "@/components/MetaData";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ConfigProvider } from "@/contexts/config.tsx";
import { usePasswordPolicy } from "@/hooks/usePasswordPolicy";

const RegisterPage = () => {
    // 表單狀態
    const [account, setAccount] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // UI 狀態
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingInit, setIsCheckingInit] = useState(true);
    const [error, setError] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);

    // Hooks
    const { checkInit, registerFirstAdmin } = useAuthStore();
    const navigate = useNavigate();
    const { validate, placeholder, policySummary, policy } = usePasswordPolicy();

    // 檢查系統初始化狀態
    useEffect(() => {
        const checkSystemInit = async () => {
            try {
                const response = await checkInit();
                // init: true = 需要初始化（未初始化）
                // init: false = 已經初始化
                setIsInitialized(!response.init);

                // 如果系統已經初始化（init = false），重定向到登入頁面
                if (!response.init) {
                    navigate('/login');
                }
            } catch (err) {
                console.error('檢查系統初始化狀態失敗:', err);
                setError('無法檢查系統狀態，請稍後再試');
            } finally {
                setIsCheckingInit(false);
            }
        };

        checkSystemInit();
    }, [checkInit, navigate]);

    // 處理註冊邏輯
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // 驗證密碼策略
        const policyErrors = validate(password);
        if (policyErrors.length > 0) {
            setError(policyErrors.join('；'));
            return;
        }

        setIsLoading(true);

        try {
            await registerFirstAdmin({
                account,
                password,
                name,
                email,
                confirmPassword: password,
            });

            // 註冊成功，跳轉到後台首頁
            navigate('/dashboard');
        } catch (err) {
            console.error('註冊失敗:', err);
            setError('註冊失敗，請檢查輸入的資訊');
        } finally {
            setIsLoading(false);
        }
    };

    // 正在檢查系統初始化狀態
    if (isCheckingInit) {
        return (
            <ConfigProvider>
                <MetaData title="系統初始化" />
                <div className="flex h-screen items-center justify-center">
                    <div className="text-center">
                        <span className="loading loading-spinner loading-lg"></span>
                        <p className="mt-4 text-base-content/70">檢查系統狀態中...</p>
                    </div>
                </div>
            </ConfigProvider>
        );
    }

    // 系統已初始化，不應該看到此頁面（會自動重定向）
    if (isInitialized) {
        return null;
    }

    return (
        <>
            <ConfigProvider>
                <MetaData title="首次註冊 - 系統管理員" />
                <div className="flex h-full flex-col items-stretch p-6 md:p-8 lg:p-16">
                    <div className="flex items-center justify-between">
                        <Logo />
                        <ThemeToggle className="btn btn-circle btn-outline border-base-300" />
                    </div>

                    <div className="flex grow flex-col">
                        <div className="grow-[1]"></div>

                        {/* 標題區域 */}
                        <h3 className="mt-8 text-center text-xl font-semibold md:mt-12 lg:mt-24">
                            系統首次設定
                        </h3>
                        <h3 className="text-base-content/70 mt-2 text-center text-sm">
                            歡迎使用智慧石化產業資訊暨媒合平台，請創建首位系統管理員帳號
                        </h3>

                        {/* 註冊表單 */}
                        <form onSubmit={handleSubmit} className="mt-6 md:mt-10">

                            {/* 帳號 */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">帳號</legend>
                                <label className="input w-full focus:outline-0">
                                    <span className="iconify lucide--user-square text-base-content/80 size-5"></span>
                                    <input
                                        className="grow focus:outline-0"
                                        placeholder="請輸入帳號"
                                        type="text"
                                        value={account}
                                        onChange={(e) => setAccount(e.target.value)}
                                        required
                                    />
                                </label>
                            </fieldset>

                            {/* 姓名 */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">姓名</legend>
                                <label className="input w-full focus:outline-0">
                                    <span className="iconify lucide--user text-base-content/80 size-5"></span>
                                    <input
                                        className="grow focus:outline-0"
                                        placeholder="請輸入姓名"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </label>
                            </fieldset>

                            {/* 電子郵件 */}
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

                            {/* 密碼 */}
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">密碼</legend>
                                <label className="input w-full focus:outline-0">
                                    <span className="iconify lucide--key-round text-base-content/80 size-5"></span>
                                    <input
                                        className="grow focus:outline-0"
                                        placeholder={placeholder}
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={policy.minLength}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-xs btn-ghost btn-circle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label="Toggle Password Visibility">
                                        {showPassword ? (
                                            <span className="iconify lucide--eye-off size-4" />
                                        ) : (
                                            <span className="iconify lucide--eye size-4" />
                                        )}
                                    </button>
                                </label>
                                <div className="text-xs text-base-content/50 mt-1 ml-1">
                                    {policySummary}
                                </div>
                            </fieldset>

                            {/* 錯誤訊息顯示區域 */}
                            {error && (
                                <div className="alert alert-error mt-4 p-2 text-sm">
                                    <span className="iconify lucide--alert-circle size-5" />
                                    <span className="whitespace-pre-line">{error}</span>
                                </div>
                            )}

                            {/* 註冊按鈕 */}
                            <button
                                type="submit"
                                className="btn btn-primary btn-wide mt-4 max-w-full gap-3 md:mt-6 w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm" />
                                        註冊中...
                                    </>
                                ) : (
                                    <>
                                        <span className="iconify lucide--user-plus size-4" />
                                        創建管理員帳號
                                    </>
                                )}
                            </button>

                            <p className="text-base-content/80 mt-4 text-center text-sm md:mt-6">
                                已經有帳號了？
                                <Link className="text-primary ms-1 hover:underline" to="/login">
                                    返回登入
                                </Link>
                            </p>
                        </form>

                        <div className="grow-[2]"></div>
                    </div>
                </div>
            </ConfigProvider>
        </>
    );
};

export default RegisterPage;
