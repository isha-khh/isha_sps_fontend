// 過渡期用：舊站的 jQuery 套件都是用 <script src> 整包載入到全域，
// 這裡宣告一下型別，讓元件裡可以用 `window.$`／`window.AOS`／`window.Fancybox`
// 而不用整支檔案都寫 any。之後元件改用純 React / Tailwind 實作後，
// 這些型別跟對應的 useEffect 也可以一起刪掉，所以故意不引入完整的 @types/jquery。
export {};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jQuery?: any;
    AOS?: {
      init: (options?: Record<string, unknown>) => void;
      refresh: () => void;
    };
    Fancybox?: {
      show: (items: Array<Record<string, unknown>>, options?: Record<string, unknown>) => void;
      bind: (selector: string, options?: Record<string, unknown>) => void;
    };
  }
}
