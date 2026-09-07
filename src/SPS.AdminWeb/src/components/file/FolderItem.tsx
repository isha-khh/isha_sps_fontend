import {FolderItemDropdown} from "./FolderItemDropdown";
import {DynamicIcon} from "@/components/file/FileTableRow";

export type IFolderItem = {
    icon: string;
    iconClass: string;
    name: string;
    filesCount: number;
    onClick?: () => void;
};


export const FolderItem = ({ icon, iconClass, name, filesCount, onClick }: IFolderItem) => {
    return (
        <div 
            className="card card-border bg-base-100 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={onClick}
        >
            <div className="card-body p-3">
                <div className="flex items-center gap-2">
                    <div className={`rounded-box flex items-center p-1.5 ${iconClass}`}>

                      <DynamicIcon iconName={icon} />
                    </div>
                    <span className="text-sm font-medium">{name}</span>
                    <div className="ms-auto">
                        <FolderItemDropdown />
                    </div>
                </div>
                <div className="text-base-content/70 mt-2 flex items-center text-xs">{filesCount} 檔案</div>
            </div>
        </div>
    );
};
