import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from 'react-router-dom';

import { Logo } from "@/components/Logo";
import { MetaData } from "@/components/MetaData";
import { ThemeToggle } from "@/components/ThemeToggle";
import { adminAuthApi } from "@/lib/api/admin-auth";
import { usePasswordPolicy } from "@/hooks/usePasswordPolicy";

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token') || '';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const [tokenError, setTokenError] = useState('');

    const { validate, placeholder, policySummary, policy } = usePasswordPolicy();

    // 驗證 Token
    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setTokenError('缺少重置密碼連結，請從郵件中點擊連結');
                setIsValidating(false);
                return;
            }

            try {
                const response = await adminAuthApi.validateResetToken(token);
                if (response.valid) {
                    setEmail(response.email);
                } else {
                    setTokenError('重置連結無效或已過期，請重新申請');
                }
            } catch (err) {
                console.error('Token validation error:', err);
                setTokenError('重置連結無效或已過期，請重新申請');
            } finally {
                setIsValidating(false);
            }
        };

        validateToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // 驗證密碼策略
        const policyErrors = validate(password);
        if (policyErrors.length > 0) {
            setError(policyErrors.join('；'));
            return;
        }

        if (password !== confirmPassword) {
            setError('確認密碼與新密碼不符');
            return;
        }

        setIsLoading(true);

        try {
            await adminAuthApi.resetPassword({
                token,
                newPassword: password,
                confirmPassword,
            });
            setIsSuccess(true);
        } catch (err: unknown) {
            console.error('Reset password error:', err);
            const errorMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || '重置密碼失敗，請稍後再試';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // 正在驗證 Token
    if (isValidating) {
        return (
            <>
                <MetaData title="重置密碼" />
                <div className="flex h-screen items-center justify-center">
                    <div className="text-center">
                        <span className="loading loading-spinner loading-lg"></span>
                        <p className="mt-4 text-base-content/70">驗證重置連結中...</p>
                    </div>
                </div>
            </>
        );
    }

    // Token 無效
    if (tokenError) {
        return (
            <>
                <MetaData title="重置密碼" />
                <div className="flex h-full flex-col items-stretch p-6 md:p-8 lg:p-16">
                    <div className="flex items-center justify-between">
                        <Link to="/login">
                            <Logo />
                        </Link>
                        <ThemeToggle className="btn btn-circle btn-outline border-base-300" />
                    </div>

                    <div className="flex grow flex-col items-center justify-center">
                        <div className="alert alert-error max-w-md">
                            <span className="iconify lucide--alert-circle size-5" />
                            <div>
                                <p className="font-semibold">連結無效</p>
                                <p className="text-sm">{tokenError}</p>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-4">
                            <Link to="/forgot-password" className="btn btn-primary">
                                <span className="iconify lucide--mail-plus size-4" />
                                重新申請
                            </Link>
                            <Link to="/login" className="btn btn-ghost">
                                返回登入
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // 重置成功
    if (isSuccess) {
        return (
            <>
                <MetaData title="重置密碼" />
                <div className="flex h-full flex-col items-stretch p-6 md:p-8 lg:p-16">
                    <div className="flex items-center justify-between">
                        <Link to="/login">
                            <Logo />
                        </Link>
                        <ThemeToggle className="btn btn-circle btn-outline border-base-300" />
                    </div>

                    <div className="flex grow flex-col items-center justify-center">
                        <div className="alert alert-success max-w-md">
                            <span className="iconify lucide--check-circle size-5" />
                            <div>
                                <p className="font-semibold">密碼重置成功</p>
                                <p className="text-sm">您的密碼已成功重置，請使用新密碼登入</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={() => navigate('/login')}
                                className="btn btn-primary"
                            >
                                <span className="iconify lucide--log-in size-4" />
                                前往登入
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <MetaData title="重置密碼" />
            <div className="flex h-full flex-col items-stretch p-6 md:p-8 lg:p-16">
                <div className="flex items-center justify-between">
                    <Link to="/login">
                        <Logo />
                    </Link>
                    <ThemeToggle className="btn btn-circle btn-outline border-base-300" />
                </div>

                <div className="flex grow flex-col">
                    <div className="grow-[1]"></div>

                    <h3 className="mt-8 text-center text-xl font-semibold md:mt-12 lg:mt-24">
                        重置密碼
                    </h3>
                    <h3 className="text-base-content/70 mt-2 text-center text-sm">
                        請設定您的新密碼
                    </h3>

                    {email && (
                        <p className="mt-2 text-center text-sm text-base-content/60">
                            帳號：{email}
                        </p>
                    )}

                    <form onSubmit={handleSubmit} className="mt-6 md:mt-10">
                        {/* 密碼策略提示 */}
                        <div className="text-xs text-base-content/50 mb-2">
                            {policySummary}
                        </div>

                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">新密碼</legend>
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
                                    aria-label="Toggle Password Visibility"
                                >
                                    {showPassword ? (
                                        <span className="iconify lucide--eye-off size-4" />
                                    ) : (
                                        <span className="iconify lucide--eye size-4" />
                                    )}
                                </button>
                            </label>
                        </fieldset>

                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">確認新密碼</legend>
                            <label className="input w-full focus:outline-0">
                                <span className="iconify lucide--key-round text-base-content/80 size-5"></span>
                                <input
                                    className="grow focus:outline-0"
                                    placeholder="請再次輸入新密碼"
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </label>
                        </fieldset>

                        {error && (
                            <div className="alert alert-error mt-4 p-2 text-sm">
                                <span className="iconify lucide--alert-circle size-5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary btn-wide mt-4 max-w-full gap-3 md:mt-6 w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm" />
                                    重置中...
                                </>
                            ) : (
                                <>
                                    <span className="iconify lucide--check size-4" />
                                    重置密碼
                                </>
                            )}
                        </button>

                        <p className="mt-4 text-center text-sm md:mt-6">
                            <Link className="text-primary hover:underline" to="/login">
                                返回登入
                            </Link>
                        </p>
                    </form>

                    <div className="grow-[2]"></div>
                </div>
            </div>
        </>
    );
};

export default ResetPasswordPage;
