export const getFileIcon = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
        case 'doc':
        case 'docx':
        case 'pdf':
            return 'fileText';
        case 'xls':
        case 'xlsx':
            return 'fileSpreadsheet';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'svg':
            return 'fileImage';
        case 'mp4':
        case 'avi':
        case 'mov':
        case 'wmv':
            return 'fileVideo';
        case 'mp3':
        case 'wav':
        case 'flac':
        case 'aac':
            return 'fileAudio';
        case 'zip':
        case 'rar':
        case '7z':
        case 'tar':
            return 'archive';
        case 'js':
        case 'ts':
        case 'jsx':
        case 'tsx':
        case 'html':
        case 'css':
        case 'json':
        case 'xml':
            return 'fileCode';
        case 'folder':
            return 'folder';
        default:
            return 'file';
    }
};
