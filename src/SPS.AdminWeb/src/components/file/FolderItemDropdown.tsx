import {MoreVertical} from "lucide-react";

export const FolderItemDropdown = () => {
    return (
        <div className="dropdown dropdown-bottom dropdown-center">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle btn-sm" aria-label="Menu">
            <MoreVertical size={16} />
            </div>
            <div tabIndex={0} className="dropdown-content bg-base-100 rounded-box mt-2 w-30 shadow">
                <ul className="menu w-full p-1.5">
                    <li>
                        <div>
                            <span className="iconify lucide--arrow-down-to-line size-4" />
                            下載
                        </div>
                    </li>

                    <li>
                        <div>
                            <span className="iconify lucide--pen-line size-4" />
                            重新命名
                        </div>
                    </li>
                    <li>
                        <div>
                            <span className="iconify lucide--user-round-plus size-4" />
                            分享
                        </div>
                    </li>
                </ul>
                <hr className="border-base-300" />
                <ul className="menu w-full p-1.5">
                    <li>
                        <div className="text-error hover:bg-error/10">
                            <span className="iconify lucide--trash size-4" />
                            移出釘選
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    );
};


export const ItemDropdown = ({ onDelete, onPermanentDelete, onDownload }: { onDelete?: () => void; onPermanentDelete?: () => void; onDownload?: () => void }) => {
    return (
        <div className="dropdown dropdown-bottom dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle btn-sm" aria-label="Menu">
            <MoreVertical size={16} />
            </div>
            <div tabIndex={0} className="dropdown-content bg-base-100 rounded-box mt-1 w-36 shadow z-50">
                <ul className="menu w-full p-1.5">
                    <li>
                        <div onClick={onDownload} role="button">
                            <span className="iconify lucide--arrow-down-to-line size-4" />
                            下載
                        </div>
                    </li>

                    <li>
                        <div>
                            <span className="iconify lucide--pen-line size-4" />
                            重新命名
                        </div>
                    </li>
                    <li>
                        <div>
                            <span className="iconify lucide--user-round-plus size-4" />
                            分享
                        </div>
                    </li>
                </ul>
                <hr className="border-base-300" />
                <ul className="menu w-full p-1.5">
                    <li>
                        <div 
                            className="text-warning hover:bg-warning/10"
                            onClick={onDelete}
                            role="button"
                        >
                            <span className="iconify lucide--trash size-4" />
                            移至回收桶
                        </div>
                    </li>
                    <li>
                        <div 
                            className="text-error hover:bg-error/10"
                            onClick={onPermanentDelete}
                            role="button"
                        >
                            <span className="iconify lucide--trash-2 size-4" />
                            永久刪除
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    );
};


export const SelectItemDropdown = () => {
    return (
        <div className="dropdown dropdown-bottom dropdown-center">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle btn-sm" aria-label="Menu">
            <MoreVertical size={16} />
            </div>
            <div tabIndex={0} className="dropdown-content bg-base-100 rounded-box mt-2 w-30 shadow">
                <ul className="menu w-full p-1.5">
                    <li>
                        <div>
                            <span className="iconify lucide--arrow-down-to-line size-4" />
                            下載
                        </div>
                    </li>

                    <li>
                        <div>
                            <span className="iconify lucide--pen-line size-4" />
                            重新命名
                        </div>
                    </li>
                    <li>
                        <div>
                            <span className="iconify lucide--user-round-plus size-4" />
                            分享
                        </div>
                    </li>
                </ul>
                <hr className="border-base-300" />
                <ul className="menu w-full p-1.5">
                    <li>
                        <div className="text-error hover:bg-error/10">
                            <span className="iconify lucide--trash size-4" />
                            刪除
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    );
};
