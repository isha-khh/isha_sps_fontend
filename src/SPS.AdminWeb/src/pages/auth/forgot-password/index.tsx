import { useState, useCallback } from "react";
import { Link } from 'react-router-dom';

import { Logo } from "@/components/Logo";
import { MetaData } from "@/components/MetaData";
import { ThemeToggle } from "@/components/ThemeToggle";
import { adminAuthApi } from "@/lib/api/admin-auth";
import { CaptchaInput } from "@/components/auth/CaptchaInput";
import type { CaptchaData } from "@/types/captcha";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null);

    // 驗證碼變更回調
    const handleCaptchaChange = useCallback((data: CaptchaData | null) => {
        setCaptchaData(data);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await adminAuthApi.forgotPassword({
                email,
                captcha: captchaData ?? undefined,
            });
            setIsSuccess(true);
        } catch (err: any) {
            console.error('Forgot password error:', err);
            const errorMessage = err?.response?.data?.error || '發送失敗，請稍後再試';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <MetaData title="忘記密碼" />

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
                        忘記密碼
                    </h3>
                    <h3 className="text-base-content/70 mt-2 text-center text-sm">
                        請輸入您的電子郵件，我們將發送重置密碼連結給您
                    </h3>

                    {isSuccess ? (
                        <div className="mt-6 md:mt-10">
                            <div className="alert alert-success">
                                <span className="iconify lucide--check-circle size-5" />
                                <div>
                                    <p className="font-semibold">郵件已發送</p>
                                    <p className="text-sm">如果此信箱已註冊，您將收到重置密碼的郵件。請檢查您的收件匣（或垃圾郵件資料夾）。</p>
                                </div>
                            </div>

                            <div className="mt-6 text-center">
                                <Link to="/login" className="btn btn-primary btn-wide">
                                    <span className="iconify lucide--arrow-left size-4" />
                                    返回登入
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="mt-6 md:mt-10">
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

                            {/* 驗證碼 */}
                            <CaptchaInput
                                scenario="forgot-password"
                                onChange={handleCaptchaChange}
                                disabled={isLoading}
                            />

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
                                        發送中...
                                    </>
                                ) : (
                                    <>
                                        <span className="iconify lucide--mail-plus size-4" />
                                        發送重置連結
                                    </>
                                )}
                            </button>

                            <p className="text-base-content/80 mt-4 text-center text-sm md:mt-6">
                                已經想起密碼了？
                                <Link className="text-primary ms-1 hover:underline" to="/login">
                                    返回登入
                                </Link>
                            </p>
                        </form>
                    )}

                    <div className="grow-[2]"></div>
                </div>
            </div>
        </>
    );
};

export default ForgotPasswordPage;
