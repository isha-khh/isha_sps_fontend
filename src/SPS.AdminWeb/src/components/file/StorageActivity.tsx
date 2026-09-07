export const StorageActivity = () => {
    return (
        <ul className="timeline timeline-vertical timeline-snap-icon timeline-hr-sm -ms-[100%] ps-10">
            <li>
                <div className="timeline-middle">
                    <div className="bg-primary/10 text-primary flex items-center rounded-full p-2">
                        <span className="iconify lucide--pencil size-4" />
                    </div>
                </div>
                <div className="timeline-end my-2.5 w-full px-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">使用者1</span>
                        <span className="text-base-content/60 text-xs">剛剛</span>
                    </div>
                    <p className="text-base-content/70 mt-0.5 text-xs">編輯 package.json </p>
                </div>
                <hr />
            </li>
            <li>
                <hr />
                <div className="timeline-middle">
                    <div className="bg-primary/10 text-primary flex items-center rounded-full p-2">
                        <span className="iconify lucide--arrow-up-from-line size-4" />
                    </div>
                </div>
                <div className="timeline-end my-2.5 w-full px-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">使用者2</span>
                        <span className="text-base-content/60 text-xs">22 小時前</span>
                    </div>
                    <p className="text-base-content/70 mt-0.5 text-xs">上傳 app.tsx 檔案在react資料夾</p>
                </div>
                <hr />
            </li>

            <li>
                <hr />
                <div className="timeline-middle">
                    <div className="bg-primary/10 text-primary flex items-center rounded-full p-2">
                        <span className="iconify lucide--folder-input size-4" />
                    </div>
                </div>
                <div className="timeline-end my-2.5 w-full px-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">使用者2</span>
                        <span className="text-base-content/60 text-xs">這禮拜</span>
                    </div>
                    <p className="text-base-content/70 mt-0.5 text-xs">移動aaa.text檔案到folder資料夾</p>
                </div>
                <hr />
            </li>
            <li>
                <hr />
                <div className="timeline-middle">
                    <div className="bg-success/10 text-success flex items-center rounded-full p-2">
                        <span className="iconify lucide--folder-plus size-4" />
                    </div>
                </div>
                <div className="timeline-end my-2.5 w-full px-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">使用者</span>
                        <span className="text-base-content/60 text-xs">這個月</span>
                    </div>
                    <p className="text-base-content/70 mt-0.5 text-xs">建立root專案</p>
                </div>
                <hr />
            </li>
            <li>
                <hr />
                <div className="timeline-middle">
                    <div className="bg-base-200 flex items-center rounded-full p-2">
                        <span className="iconify lucide--more-horizontal size-4" />
                    </div>
                </div>
                <div className="timeline-end mx-5 my-2">
                    <button className="btn btn-sm btn-soft btn-primary">查看所有紀錄</button>
                </div>
            </li>
        </ul>
    );
};
