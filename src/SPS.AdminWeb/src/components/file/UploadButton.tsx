"use client";

import {FileUpload} from "./FileUpload";
import * as Icons from "lucide-react";


export const UploadButton = ({ onSuccess }: { onSuccess?: () => void }) => {
    return (
        <>
            <button
                className="btn btn-ghost border-base-300 btn-sm"
                aria-label="Upload file"
                onClick={() => document.querySelector<HTMLDialogElement>("#apps-file-upload-modal")?.showModal()}>
                <Icons.Upload size={16}/>

                上傳
            </button>
            <dialog id="apps-file-upload-modal" className="modal">
                <div className="modal-box max-w-3xl max-h-96">
                    <div className="flex items-center justify-between">
                        <p className="font-medium">上傳檔案</p>
                        <form method="dialog">
                            <button className="btn btn-ghost btn-sm btn-circle" aria-label="Close upload file modal">
                                <span className="iconify lucide--x size-5" />
                            </button>
                        </form>
                    </div>
                    <div className="mt-4">
          <FileUpload
            multiple={true}
            maxSize={150 * 1024 * 1024}
            acceptedFileTypes={[
            ]}
            onSuccess={() => onSuccess?.()}
            labels={{
              dropzone: '拖曳檔案至此',
              browse: '或點擊上傳',
              maxFiles: '最多上傳',
              maxSize: '檔案大小上限',
              uploading: '上傳中...'
            }}
          />
                        <div className="mt-5 text-end">
                            <button className="btn btn-primary btn-sm">
                                                <Icons.ArrowDownToLine size={16}/>

                                匯入
                            </button>
                        </div>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>關閉</button>
                </form>
            </dialog>
        </>
    );
};
