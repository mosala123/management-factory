// lib/utils.ts
// دوال مساعدة عامة

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("ar-EG", {
        style: "currency",
        currency: "EGP",
    }).format(amount);
}

export function getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
        men: "رجالي",
        women: "نسائي",
        kids: "أطفال",
        uniform: "موحدات"
    };
    return labels[category] || category;
}
