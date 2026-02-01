// ==========================================
// Product Icons Utility
// ==========================================

export function getProductIcon(name: string): string {
    const lowerName = name.toLowerCase();

    // Coffee & Hot Drinks
    if (
        lowerName.includes('coffee') ||
        lowerName.includes('espresso') ||
        lowerName.includes('latte') ||
        lowerName.includes('cappuccino') ||
        lowerName.includes('americano') ||
        lowerName.includes('mocha') ||
        lowerName.includes('قهوة') ||
        lowerName.includes('اسبريسو') ||
        lowerName.includes('لاتيه') ||
        lowerName.includes('كابتشينو') ||
        lowerName.includes('امريكانو') ||
        lowerName.includes('موكا') ||
        lowerName.includes('بن')
    ) {
        return '☕';
    }

    // Tea
    if (
        lowerName.includes('tea') ||
        lowerName.includes('chai') ||
        lowerName.includes('matcha') ||
        lowerName.includes('شاي') ||
        lowerName.includes('كرك') ||
        lowerName.includes('ماتشا')
    ) {
        return '🍵';
    }

    // Cold Drinks & Juices
    if (
        lowerName.includes('juice') ||
        lowerName.includes('smoothie') ||
        lowerName.includes('milkshake') ||
        lowerName.includes('ice') ||
        lowerName.includes('cola') ||
        lowerName.includes('soda') ||
        lowerName.includes('water') ||
        lowerName.includes('mojito') ||
        lowerName.includes('عصير') ||
        lowerName.includes('سموذي') ||
        lowerName.includes('ميلك شيك') ||
        lowerName.includes('بارد') ||
        lowerName.includes('مثلج') ||
        lowerName.includes('مياه') ||
        lowerName.includes('ماء') ||
        lowerName.includes('موهيتو') ||
        lowerName.includes('غازية')
    ) {
        return '🥤';
    }

    // Sweets & Desserts
    if (
        lowerName.includes('cake') ||
        lowerName.includes('dessert') ||
        lowerName.includes('cheesecake') ||
        lowerName.includes('brownie') ||
        lowerName.includes('كيك') ||
        lowerName.includes('حلى') ||
        lowerName.includes('تشيز كيك') ||
        lowerName.includes('براوني') ||
        lowerName.includes('جاتوه')
    ) {
        return '🍰';
    }

    // Cookies
    if (
        lowerName.includes('cookie') ||
        lowerName.includes('biscuit') ||
        lowerName.includes('كوكيز') ||
        lowerName.includes('بسكويت')
    ) {
        return '🍪';
    }

    // Kunafa & Oriental Sweets
    if (
        lowerName.includes('kunafa') ||
        lowerName.includes('knaken') ||
        lowerName.includes('baklava') ||
        lowerName.includes('basbousa') ||
        lowerName.includes('كنافة') ||
        lowerName.includes('بقلاوة') ||
        lowerName.includes('بسبوسة')
    ) {
        return '🍮'; // Or maybe 🍯 for oriental sweets? 🍮 is Custard/Flan but looks like a dessert plate
    }

    // Pastries & Croissants
    if (
        lowerName.includes('croissant') ||
        lowerName.includes('bread') ||
        lowerName.includes('toast') ||
        lowerName.includes('bun') ||
        lowerName.includes('کرواسون') ||
        lowerName.includes('خبز') ||
        lowerName.includes('توست') ||
        lowerName.includes('فطيرة') ||
        lowerName.includes('معجنات')
    ) {
        return '🥐';
    }

    // Food & Meals
    if (
        lowerName.includes('sandwich') ||
        lowerName.includes('burger') ||
        lowerName.includes('meal') ||
        lowerName.includes('breakfast') ||
        lowerName.includes('lunch') ||
        lowerName.includes('ساندوتش') ||
        lowerName.includes('برجر') ||
        lowerName.includes('وجبة') ||
        lowerName.includes('فطور') ||
        lowerName.includes('غداء')
    ) {
        return '🍔';
    }

    // Ice Cream
    if (
        lowerName.includes('ice cream') ||
        lowerName.includes('gelato') ||
        lowerName.includes('ايس كريم') ||
        lowerName.includes('جيلاتو')
    ) {
        return '🍦';
    }

    // Default Generic Icon
    return '🍽️';
}
