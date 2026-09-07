import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store.ts";
import { FilePickerModal } from "@/components/shared/FilePickerModal";
import type { FileListItem, FileUploadResponse } from "@/types/files";

const DEFAULT_AVATAR = "/assets/avatars/1.png";

export const TopbarProfileMenu = () => {
    const { logout, user, updateAvatar } = useAuthStore();
    const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // 獲取頭像 URL
    const avatarUrl = user?.avatarUrl || DEFAULT_AVATAR;

    const handleAvatarClick = () => {
        setIsFilePickerOpen(true);
    };

    const handleFileSelect = async (file: FileListItem | FileUploadResponse) => {
        setIsUpdating(true);
        try {
            // FileListItem 使用 id，FileUploadResponse 使用 fileId
            const fileId = 'id' in file ? file.id : file.fileId;
            await updateAvatar(fileId);
        } catch (error) {
            console.error('Failed to update avatar:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCloseDrawer = () => {
        const checkbox = document.getElementById('topbar-profile-drawer') as HTMLInputElement;
        if (checkbox) {
            checkbox.checked = false;
        }
    };

    return (
        <div>
            <div className="drawer drawer-end">
                <input id="topbar-profile-drawer" type="checkbox" className="drawer-toggle" />
                <div className="drawer-content">
                    <label htmlFor="topbar-profile-drawer" className="btn btn-ghost max-sm:btn-square gap-2 px-1.5">
                        <div className="avatar">
                            <div className="bg-base-200 mask mask-squircle w-8">
                                <img src={avatarUrl} alt="Avatar" />
                            </div>
                        </div>
                        <div className="text-start max-sm:hidden">
                            <p className="text-sm/none">{user?.name}</p>
                            <p className="text-base-content/50 mt-0.5 text-xs/none">{user?.roles?.[0]?.name}</p>
                        </div>
                    </label>
                </div>
                <div className="drawer-side z-50">
                    <label
                        htmlFor="topbar-profile-drawer"
                        aria-label="close sidebar"
                        className="drawer-overlay"></label>
                    <div className="h-full w-72 p-2 sm:w-84">
                        <div className="bg-base-100 rounded-box relative flex h-full flex-col pt-4 sm:pt-8">
                            <label
                                htmlFor="topbar-profile-drawer"
                                className="btn btn-xs btn-circle btn-ghost absolute start-2 top-2"
                                aria-label="Close">
                                <span className="iconify lucide--x size-4" />
                            </label>

                            <div className="flex flex-col items-center">
                                <div className="relative">
                                    <div
                                        className="avatar bg-base-200 isolate size-20 cursor-pointer overflow-hidden rounded-full px-1 pt-1 md:size-24 hover:opacity-80 transition-opacity"
                                        onClick={handleAvatarClick}
                                    >
                                        {isUpdating ? (
                                            <div className="flex items-center justify-center h-full w-full">
                                                <span className="loading loading-spinner loading-md" />
                                            </div>
                                        ) : (
                                            <img src={avatarUrl} alt="User Avatar" />
                                        )}
                                    </div>
                                    <div
                                        className="bg-base-100 absolute end-0 bottom-0 flex items-center justify-center rounded-full p-1.5 shadow-sm cursor-pointer hover:bg-base-200 transition-colors"
                                        onClick={handleAvatarClick}
                                    >
                                        <span className="iconify lucide--pencil size-4" />
                                    </div>
                                </div>

                                <p className="mt-4 text-lg/none font-medium sm:mt-8">{user?.name}</p>
                                <p className="text-base-content/60 mt-1 text-sm">{user?.email}</p>

                            </div>

                            <div className="border-base-300 mt-4 grow overflow-auto border-t border-dashed px-2 sm:mt-6">
                                <ul className="menu w-full p-2">
                                    <li className="menu-title">帳號管理</li>
                                    <li>
                                        <Link to="/profile" onClick={handleCloseDrawer}>
                                            <span className="iconify lucide--user size-4.5" />
                                            <span>個人資料</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/profile" onClick={handleCloseDrawer}>
                                            <span className="iconify lucide--lock size-4.5" />
                                            <span>修改密碼</span>
                                        </Link>
                                    </li>

                                    <li className="menu-title">系統設定</li>
                                    <li>
                                        <Link to="/system/config" onClick={handleCloseDrawer}>
                                            <span className="iconify lucide--settings size-4.5" />
                                            <span>系統設定</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/system/accounts" onClick={handleCloseDrawer}>
                                            <span className="iconify lucide--users size-4.5" />
                                            <span>帳號管理</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/system/roles" onClick={handleCloseDrawer}>
                                            <span className="iconify lucide--shield size-4.5" />
                                            <span>角色權限</span>
                                        </Link>
                                    </li>

                                    <li className="mt-4">
                                        <button className="text-error hover:bg-error/10" onClick={()=>logout()}>
                                            <span className="iconify lucide--log-out size-4.5" />
                                            <span>登出</span>
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 檔案選擇器 Modal */}
            <FilePickerModal
                isOpen={isFilePickerOpen}
                onClose={() => setIsFilePickerOpen(false)}
                onSelect={handleFileSelect}
                fileType="image"
                title="選擇頭像圖片"
            />
        </div>
    );
};
