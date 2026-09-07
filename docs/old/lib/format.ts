export function formatNumber(n: number) {
    return new Intl.NumberFormat("zh-TW").format(n);
}

export function formatCurrency(n: number) {
    return new Intl.NumberFormat("zh-TW", {
        style: "currency",
        currency: "TWD",
        maximumFractionDigits: 0,
    }).format(n);
}