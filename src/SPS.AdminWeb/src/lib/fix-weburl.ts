/**
 * 擷取從 /api 開始的路徑
 * @param {string} url - 原始路徑 (例如: /sps/api/FileManagement/...)
 * @returns {string} 處理後的路徑 (例如: /api/FileManagement/...)
 */
export const formatApiPath = (url:string|undefined) => {
    if (!url) return "";

    // 使用正規表達式尋找 /api 及其後的所有字元
    const match = url.match(/\/api\/.*/);

    // 如果匹配成功，回傳匹配到的第一個結果；否則回傳原始 url
    return match ? match[0] : url;
};