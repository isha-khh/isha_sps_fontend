/**
 * 退信代碼解析工具
 * 基於 RFC 3463 (Enhanced Mail System Status Codes) 標準
 * 格式: X.Y.Z
 * - X: 類別 (2=成功, 4=暫時性失敗, 5=永久性失敗)
 * - Y: 主題 (0-7)
 * - Z: 詳細代碼
 */

export interface BounceCodeInfo {
  code: string;
  category: 'success' | 'temporary' | 'permanent' | 'unknown';
  categoryText: string;
  subject: string;
  description: string;
  suggestion: string;
}

// 類別說明
const CATEGORY_MAP: Record<string, { type: 'success' | 'temporary' | 'permanent'; text: string }> = {
  '2': { type: 'success', text: '成功' },
  '4': { type: 'temporary', text: '暫時性失敗' },
  '5': { type: 'permanent', text: '永久性失敗' },
};

// 主題說明 (Y 值)
const SUBJECT_MAP: Record<string, string> = {
  '0': '其他/未定義',
  '1': '地址相關',
  '2': '信箱相關',
  '3': '郵件系統相關',
  '4': '網路/路由相關',
  '5': '郵件傳遞協議相關',
  '6': '郵件內容/媒體相關',
  '7': '安全/政策相關',
};

// 詳細代碼對照表 (X.Y.Z)
const BOUNCE_CODES: Record<string, { description: string; suggestion: string }> = {
  // ========== 2.X.X 成功 ==========
  '2.0.0': {
    description: '成功（未定義）',
    suggestion: '郵件已成功送達。',
  },
  '2.1.0': {
    description: '目標地址有效',
    suggestion: '收件地址已驗證有效。',
  },
  '2.1.5': {
    description: '目標地址有效',
    suggestion: '收件地址有效，郵件已送達。',
  },

  // ========== 4.X.X 暫時性失敗 ==========
  '4.0.0': {
    description: '暫時性錯誤（未定義）',
    suggestion: '系統會自動重試，通常可自行恢復。',
  },
  '4.1.0': {
    description: '其他地址問題（暫時）',
    suggestion: '暫時無法確認地址，系統將重試。',
  },
  '4.1.1': {
    description: '收件人信箱地址無法識別（暫時）',
    suggestion: '伺服器暫時無法驗證，系統將重試。',
  },
  '4.1.8': {
    description: '寄件人地址格式錯誤（暫時）',
    suggestion: '檢查寄件人地址格式是否正確。',
  },
  '4.2.0': {
    description: '信箱問題（暫時）',
    suggestion: '收件信箱暫時無法使用，稍後重試。',
  },
  '4.2.1': {
    description: '信箱已停用（暫時）',
    suggestion: '收件信箱暫時停用，請聯繫收件人。',
  },
  '4.2.2': {
    description: '信箱已滿',
    suggestion: '收件人信箱空間不足，請聯繫收件人清理信箱。',
  },
  '4.2.3': {
    description: '郵件過大（暫時）',
    suggestion: '郵件大小超過限制，嘗試減小附件大小。',
  },
  '4.2.4': {
    description: '信箱擴展問題',
    suggestion: '郵件清單擴展時發生問題，稍後重試。',
  },
  '4.3.0': {
    description: '郵件系統問題（暫時）',
    suggestion: '目標郵件系統暫時無法處理，稍後重試。',
  },
  '4.3.1': {
    description: '郵件系統已滿',
    suggestion: '目標郵件系統磁碟空間不足。',
  },
  '4.3.2': {
    description: '系統不接受郵件（暫時）',
    suggestion: '目標系統暫時不接受新郵件。',
  },
  '4.3.5': {
    description: '系統配置錯誤',
    suggestion: '目標系統配置問題，請稍後重試。',
  },
  '4.4.0': {
    description: '網路問題（暫時）',
    suggestion: '網路連線問題，系統將自動重試。',
  },
  '4.4.1': {
    description: '無法連接目標伺服器',
    suggestion: '目標伺服器暫時無回應，稍後重試。',
  },
  '4.4.2': {
    description: '連線中斷',
    suggestion: '與目標伺服器的連線中斷，稍後重試。',
  },
  '4.4.3': {
    description: '路由暫時失敗',
    suggestion: '郵件路由問題，系統將自動重試。',
  },
  '4.4.4': {
    description: '無法路由',
    suggestion: '暫時無法找到郵件路由。',
  },
  '4.4.5': {
    description: '郵件系統擁塞',
    suggestion: '目標系統負載過高，稍後重試。',
  },
  '4.4.6': {
    description: '路由循環',
    suggestion: '檢測到郵件路由循環。',
  },
  '4.4.7': {
    description: '傳送超時',
    suggestion: '郵件傳送超時，系統將重試。',
  },
  '4.5.0': {
    description: '協議問題（暫時）',
    suggestion: 'SMTP 協議暫時性問題。',
  },
  '4.5.3': {
    description: '參數過多',
    suggestion: '郵件收件人數量過多，請分批發送。',
  },
  '4.7.0': {
    description: '安全問題（暫時）',
    suggestion: '暫時的安全驗證問題，稍後重試。',
  },
  '4.7.1': {
    description: '郵件被拒絕（暫時）',
    suggestion: '郵件暫時被目標伺服器拒絕。',
  },

  // ========== 5.X.X 永久性失敗 ==========
  '5.0.0': {
    description: '永久性錯誤（未定義）',
    suggestion: '無法送達，請確認收件人地址。',
  },
  '5.1.0': {
    description: '地址錯誤',
    suggestion: '收件人地址無效，請檢查並更正。',
  },
  '5.1.1': {
    description: '收件人信箱不存在',
    suggestion: '該信箱地址不存在，請確認收件人地址是否正確。',
  },
  '5.1.2': {
    description: '網域不存在',
    suggestion: '收件人的郵件網域不存在，請檢查網域名稱。',
  },
  '5.1.3': {
    description: '地址格式錯誤',
    suggestion: '郵件地址格式不正確，請修正。',
  },
  '5.1.4': {
    description: '地址模糊',
    suggestion: '收件地址不明確，可能有多個匹配。',
  },
  '5.1.5': {
    description: '目標地址有效（但無法送達）',
    suggestion: '地址有效但因其他原因無法送達。',
  },
  '5.1.6': {
    description: '收件地址已移動，無法轉發',
    suggestion: '收件人已變更地址，請更新聯絡資訊。',
  },
  '5.1.7': {
    description: '寄件人地址格式錯誤',
    suggestion: '請檢查系統設定的寄件人地址格式。',
  },
  '5.1.8': {
    description: '寄件人地址無效',
    suggestion: '寄件人地址被目標伺服器拒絕。',
  },
  '5.1.9': {
    description: '郵件將導致循環',
    suggestion: '郵件路由會產生循環，無法送達。',
  },
  '5.2.0': {
    description: '信箱問題',
    suggestion: '收件人信箱有問題，無法接收郵件。',
  },
  '5.2.1': {
    description: '信箱已停用',
    suggestion: '收件人信箱已被停用或刪除。',
  },
  '5.2.2': {
    description: '信箱已滿',
    suggestion: '收件人信箱已滿，無法接收新郵件。請聯繫收件人。',
  },
  '5.2.3': {
    description: '郵件過大',
    suggestion: '郵件大小超過收件人信箱的限制，請減少附件大小。',
  },
  '5.2.4': {
    description: '信箱擴展失敗',
    suggestion: '郵件清單展開失敗。',
  },
  '5.3.0': {
    description: '郵件系統問題',
    suggestion: '目標郵件系統無法處理此郵件。',
  },
  '5.3.1': {
    description: '郵件系統已滿',
    suggestion: '目標郵件系統儲存空間不足。',
  },
  '5.3.2': {
    description: '系統不接受郵件',
    suggestion: '目標系統配置為不接受網路郵件。',
  },
  '5.3.3': {
    description: '不支援的功能',
    suggestion: '目標系統不支援郵件所需的功能。',
  },
  '5.3.4': {
    description: '郵件過大（系統限制）',
    suggestion: '郵件超過目標系統的大小限制。',
  },
  '5.3.5': {
    description: '系統配置錯誤',
    suggestion: '目標系統配置有誤，無法接收郵件。',
  },
  '5.4.0': {
    description: '網路路由問題',
    suggestion: '無法路由郵件到目標地址。',
  },
  '5.4.1': {
    description: '無法連接目標伺服器',
    suggestion: '無法連接到收件人的郵件伺服器。',
  },
  '5.4.2': {
    description: '連線錯誤',
    suggestion: '與目標伺服器的連線發生錯誤。',
  },
  '5.4.3': {
    description: '路由失敗',
    suggestion: '無法找到有效的郵件路由。',
  },
  '5.4.4': {
    description: '無法路由',
    suggestion: '目標地址無法路由，請檢查網域 DNS 設定。',
  },
  '5.4.5': {
    description: '郵件系統擁塞',
    suggestion: '目標系統長期處於擁塞狀態。',
  },
  '5.4.6': {
    description: '路由循環',
    suggestion: '郵件路由形成循環，無法送達。',
  },
  '5.4.7': {
    description: '傳送超時',
    suggestion: '郵件傳送反覆超時，無法完成。',
  },
  '5.5.0': {
    description: 'SMTP 協議錯誤',
    suggestion: 'SMTP 通訊錯誤。',
  },
  '5.5.1': {
    description: '命令無法識別',
    suggestion: '目標伺服器無法識別 SMTP 命令。',
  },
  '5.5.2': {
    description: '命令語法錯誤',
    suggestion: 'SMTP 命令語法錯誤。',
  },
  '5.5.3': {
    description: '收件人過多',
    suggestion: '單封郵件收件人數量超過限制，請分批發送。',
  },
  '5.5.4': {
    description: '命令參數無效',
    suggestion: 'SMTP 命令參數無效。',
  },
  '5.5.5': {
    description: '命令順序錯誤',
    suggestion: 'SMTP 命令順序不正確。',
  },
  '5.6.0': {
    description: '媒體/內容問題',
    suggestion: '郵件內容或格式有問題。',
  },
  '5.6.1': {
    description: '媒體類型不支援',
    suggestion: '郵件包含不支援的媒體類型。',
  },
  '5.6.2': {
    description: '不支援的轉換',
    suggestion: '郵件需要不支援的內容轉換。',
  },
  '5.6.3': {
    description: '不支援的轉換（有損失）',
    suggestion: '轉換會導致內容損失。',
  },
  '5.6.5': {
    description: '轉換失敗',
    suggestion: '郵件內容轉換失敗。',
  },
  '5.6.6': {
    description: '郵件內容損壞',
    suggestion: '郵件內容損壞無法處理。',
  },
  '5.7.0': {
    description: '安全/政策問題',
    suggestion: '郵件因安全或政策原因被拒絕。',
  },
  '5.7.1': {
    description: '郵件被拒絕（權限不足）',
    suggestion: '寄件人沒有權限發送到此收件人。可能需要驗證或授權。',
  },
  '5.7.2': {
    description: '禁止擴展郵件清單',
    suggestion: '不允許擴展目標郵件清單。',
  },
  '5.7.3': {
    description: '不支援的安全功能',
    suggestion: '需要的安全功能不被支援。',
  },
  '5.7.4': {
    description: '安全功能不可用',
    suggestion: '所需的安全功能暫時不可用。',
  },
  '5.7.5': {
    description: '加密失敗',
    suggestion: '加密驗證失敗。',
  },
  '5.7.6': {
    description: '加密演算法不支援',
    suggestion: '所需的加密演算法不被支援。',
  },
  '5.7.7': {
    description: '訊息完整性失敗',
    suggestion: '郵件完整性驗證失敗。',
  },
  '5.7.8': {
    description: '驗證憑證失敗',
    suggestion: 'SMTP 認證憑證失敗。',
  },
  '5.7.9': {
    description: '需要驗證',
    suggestion: '需要進行身份驗證才能發送郵件。',
  },
  '5.7.10': {
    description: '加密需要',
    suggestion: '連線需要加密但未使用。',
  },
  '5.7.11': {
    description: '加密需要（外部連線）',
    suggestion: '外部連線需要加密。',
  },
  '5.7.12': {
    description: '需要未來版本加密',
    suggestion: '需要更新版本的加密協議。',
  },
  '5.7.13': {
    description: '帳號已停用',
    suggestion: '寄件人帳號已被停用。',
  },
  '5.7.14': {
    description: '信任關係失敗',
    suggestion: '與目標伺服器的信任關係驗證失敗。',
  },
  '5.7.15': {
    description: '優先級過低',
    suggestion: '郵件優先級不足以處理。',
  },
  '5.7.16': {
    description: '郵件過大（安全限制）',
    suggestion: '郵件大小超過安全限制。',
  },
  '5.7.17': {
    description: '信箱擁有者已變更',
    suggestion: '信箱擁有者已變更，需要重新建立連結。',
  },
  '5.7.18': {
    description: '網域擁有者已變更',
    suggestion: '網域擁有者已變更。',
  },
  '5.7.19': {
    description: 'RRVS 測試失敗',
    suggestion: '收件人地址驗證測試失敗。',
  },
  '5.7.20': {
    description: 'DMARC 驗證失敗',
    suggestion: 'DMARC 驗證失敗，請檢查 DNS 的 DMARC 記錄設定。',
  },
  '5.7.21': {
    description: 'DKIM 驗證失敗',
    suggestion: 'DKIM 簽章驗證失敗。',
  },
  '5.7.22': {
    description: 'SPF 驗證失敗',
    suggestion: 'SPF 驗證失敗，請檢查 DNS 的 SPF 記錄設定。',
  },
  '5.7.23': {
    description: '郵件被標記為垃圾郵件',
    suggestion: '郵件被判定為垃圾郵件，請檢查郵件內容。',
  },
  '5.7.24': {
    description: 'SPF 結果無效',
    suggestion: 'SPF 記錄導致無效結果。',
  },
  '5.7.25': {
    description: '反向 DNS 驗證失敗',
    suggestion: '寄件伺服器的反向 DNS 查詢失敗。',
  },
  '5.7.26': {
    description: '多重驗證失敗',
    suggestion: '多個驗證機制都失敗了。',
  },
  '5.7.27': {
    description: '寄件人地址有身份問題',
    suggestion: '寄件人地址的身份驗證有問題。',
  },
};

/**
 * 解析退信代碼
 * @param code 退信代碼 (如 "5.1.1" 或 "550 5.1.1")
 * @returns 退信代碼資訊
 */
export function parseBounceCode(code: string | undefined | null): BounceCodeInfo {
  if (!code) {
    return {
      code: '',
      category: 'unknown',
      categoryText: '未知',
      subject: '未知',
      description: '無退信代碼',
      suggestion: '無法判斷退信原因。',
    };
  }

  // 嘗試提取 X.Y.Z 格式的代碼
  const match = code.match(/([245])\.(\d+)\.(\d+)/);

  if (!match) {
    // 嘗試解析傳統 SMTP 錯誤碼 (如 550, 421)
    const smtpMatch = code.match(/^([245])\d{2}/);
    if (smtpMatch) {
      const category = CATEGORY_MAP[smtpMatch[1]] || { type: 'unknown' as const, text: '未知' };
      return {
        code: code,
        category: category.type,
        categoryText: category.text,
        subject: '傳統 SMTP 錯誤碼',
        description: `SMTP 錯誤碼 ${code.substring(0, 3)}`,
        suggestion: smtpMatch[1] === '5'
          ? '永久性錯誤，請檢查收件人地址。'
          : '暫時性錯誤，系統將自動重試。',
      };
    }

    return {
      code: code,
      category: 'unknown',
      categoryText: '未知',
      subject: '未知格式',
      description: `無法解析的代碼: ${code}`,
      suggestion: '請參考完整的退信訊息了解詳情。',
    };
  }

  const [, x, y, z] = match;
  const fullCode = `${x}.${y}.${z}`;
  const category = CATEGORY_MAP[x] || { type: 'unknown' as const, text: '未知' };
  const subject = SUBJECT_MAP[y] || '未知主題';

  // 嘗試精確匹配
  let codeInfo = BOUNCE_CODES[fullCode];

  // 若無精確匹配，嘗試 X.Y.0 通用匹配
  if (!codeInfo) {
    codeInfo = BOUNCE_CODES[`${x}.${y}.0`];
  }

  // 若仍無匹配，使用預設
  if (!codeInfo) {
    codeInfo = {
      description: `${category.text} - ${subject}`,
      suggestion: x === '5'
        ? '永久性錯誤，請檢查收件人地址或聯繫對方管理員。'
        : '暫時性錯誤，系統將自動重試。',
    };
  }

  return {
    code: fullCode,
    category: category.type,
    categoryText: category.text,
    subject,
    description: codeInfo.description,
    suggestion: codeInfo.suggestion,
  };
}

/**
 * 取得退信代碼的簡短說明
 */
export function getBounceCodeDescription(code: string | undefined | null): string {
  const info = parseBounceCode(code);
  return info.description;
}

/**
 * 取得退信代碼的處理建議
 */
export function getBounceCodeSuggestion(code: string | undefined | null): string {
  const info = parseBounceCode(code);
  return info.suggestion;
}

/**
 * 判斷是否為硬退信 (永久性失敗)
 */
export function isHardBounce(code: string | undefined | null): boolean {
  const info = parseBounceCode(code);
  return info.category === 'permanent';
}

/**
 * 判斷是否為軟退信 (暫時性失敗)
 */
export function isSoftBounce(code: string | undefined | null): boolean {
  const info = parseBounceCode(code);
  return info.category === 'temporary';
}
