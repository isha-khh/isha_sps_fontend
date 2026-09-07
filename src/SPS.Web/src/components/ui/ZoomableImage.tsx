/**
 * 積木元件：點圖放大成 fancybox 燈箱，用的是整站已經在跑的全域綁定
 * （coreScript.js 裡的 `Fancybox.bind('[data-fancybox]', {...})`）——
 * 只要 `<a>` 上有 `data-fancybox` 屬性，fancybox 自己就會接手，跟
 * Tabs／Modal 是同一種「掛好屬性、交給已載入的套件處理」模式，這裡
 * 不用另外寫 useEffect。
 *
 * `group` 給同一個值可以把好幾張圖歸成同一組燈箱（左右可以切換）；
 * 沒給的話用圖片網址自己當分組值，讓每張圖預設彼此獨立（不會因為
 * 剛好都沒給 group，就被 fancybox 誤判成同一組）。
 *
 * 用法：<ZoomableImage src="/images/all/new_logo.jpg" alt="..." />
 */
export default function ZoomableImage({
  src,
  alt = "",
  caption,
  group,
  className = "ratio ratio-4x3",
}: {
  src: string;
  alt?: string;
  caption?: string;
  group?: string;
  className?: string;
}) {
  return (
    <a href={src} data-fancybox={group ?? src} data-caption={caption} title={caption ?? "點圖放大"} className={className}>
      <img className="img-fluid d-block" src={src} alt={alt} />
    </a>
  );
}
