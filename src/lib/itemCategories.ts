export function getItemType(storeId: string, itemId: string): "food" | "drink" | "object" {
  // Bar items are always drinks
  if (storeId === "bar") return "drink";
  
  // Restaurant items are food
  if (storeId === "restaurant") return "food";
  
  // Pizzeria items can be both food and drinks
  if (storeId === "pizzeria") {
    const drinkItems = [
      "refrigerante", "suco_natural", "agua_mineral", "agua_com_gas", 
      "cha_gelado", "limonada_siciliana", "smoothie_frutas", "cafe_expresso"
    ];
    return drinkItems.includes(itemId) ? "drink" : "food";
  }
  
  // Cafeteria items can be both food and drinks
  if (storeId === "cafeteria") {
    const drinkItems = [
      "cafe_expresso", "cafe_latte", "cappuccino", "mocha", "cha_verde",
      "cha_camomila", "chocolate_quente", "smoothie_frutas", "suco_laranja",
      "agua_gas", "refrigerante", "energetico"
    ];
    return drinkItems.includes(itemId) ? "drink" : "food";
  }
  
  // Ice cream items are food
  if (storeId === "icecream") return "food";
  
  // Pharmacy medicines for diseases should be treated as objects but marked as medicine
  if (storeId === "pharmacy") {
    // Disease medicines should go to objects tab but be usable
    return "object";
  }
  
  // All other items (jewelry, sexshop) are objects
  return "object";
}

export function isAlcoholic(storeId: string, itemId: string): boolean {
  // Non-alcoholic drinks from bar
  const nonAlcoholicBarDrinks = [
    "refresco_pessego", "cha_gelado", "leite_dourado", "agua_cristalina", 
    "smoothie_energia", "mocktail_tropical", "limonada_magica", "mate_gelado",
    "kombucha_saude", "agua_infusao"
  ];
  
  // Non-alcoholic drinks from cafeteria
  const nonAlcoholicCafeteriaDrinks = [
    "cafe_expresso", "cafe_latte", "cappuccino", "mocha", "cha_verde",
    "cha_camomila", "chocolate_quente", "smoothie_frutas", "suco_laranja",
    "agua_gas", "refrigerante", "energetico"
  ];
  
  // If it's from bar and not in non-alcoholic list, it's alcoholic
  if (storeId === "bar") {
    return !nonAlcoholicBarDrinks.includes(itemId);
  }
  
  // If it's from cafeteria, all drinks are non-alcoholic
  if (storeId === "cafeteria") {
    return false;
  }
  
  // Other stores don't have alcoholic drinks
  return false;
}

export function getAlcoholLevel(storeId: string, itemId: string): number {
  if (!isAlcoholic(storeId, itemId)) return 0;
  
  // Light alcoholic drinks (5-8% alcohol) - increase alcoholism by 5-8
  const lightDrinks = [
    "soju_brando", "cerveja_fogo", "cerveja_gelada", "vinho_elfico"
  ];
  
  // Medium alcoholic drinks (10-15% alcohol) - increase alcoholism by 10-15
  const mediumDrinks = [
    "makgeolli_floresta", "licor_lua", "vinho_tinto", "hidromel_abelhas"
  ];
  
  // Strong alcoholic drinks (20%+ alcohol) - increase alcoholism by 20-25
  const strongDrinks = [
    "whisky_draconian", "absinto_verde", "vodka_gelo", "rum_capitao", 
    "tequila_agave", "cachaca_ouro"
  ];
  
  if (lightDrinks.includes(itemId)) return 5;
  if (mediumDrinks.includes(itemId)) return 10;
  if (strongDrinks.includes(itemId)) return 20;
  
  // Default for other alcoholic drinks
  return 8;
}

export function getDrinkEmoji(itemName: string): string {
  const name = itemName.toLowerCase();
  
  // Refrigerantes
  if (name.includes('refrigerante') || name.includes('cola') || name.includes('guaraná')) return '🥤';
  
  // Sucos
  if (name.includes('suco') || name.includes('laranja') || name.includes('maracujá') || name.includes('uva')) return '🧃';
  
  // Água
  if (name.includes('água') || name.includes('agua') || name.includes('mineral')) return '💧';
  
  // Café
  if (name.includes('café') || name.includes('cafe') || name.includes('espresso') || name.includes('cappuccino') || name.includes('latte') || name.includes('mocha')) return '☕';
  
  // Chá
  if (name.includes('chá') || name.includes('cha')) return '🍵';
  
  // Chocolate quente
  if (name.includes('chocolate quente')) return '🍫';
  
  // Smoothie
  if (name.includes('smoothie')) return '🥤';
  
  // Limonada
  if (name.includes('limonada') || name.includes('limão')) return '🍋';
  
  // Energético
  if (name.includes('energético') || name.includes('energetico')) return '⚡';
  
  // Bebidas alcoólicas
  if (name.includes('cerveja')) return '🍺';
  if (name.includes('vinho')) return '🍷';
  if (name.includes('whisky') || name.includes('vodka') || name.includes('rum') || name.includes('tequila') || name.includes('cachaça')) return '🥃';
  if (name.includes('soju') || name.includes('sake')) return '🍶';
  if (name.includes('hidromel') || name.includes('licor')) return '🍯';
  
  // Default para bebidas
  return '🥤';
}

export function getCategoryIcon(itemType: "food" | "drink" | "object", itemName?: string): string {
  switch (itemType) {
    case "food": return "🍽️";
    case "drink": return itemName ? getDrinkEmoji(itemName) : "🥤";
    case "object": return "📦";
    default: return "📦";
  }
}

export function getEffectIcon(effectType: "health" | "hunger" | "mood" | "alcoholism" | "energy"): string {
  switch (effectType) {
    case "health": return "💊";
    case "hunger": return "🍽️";
    case "mood": return "😊";
    case "energy": return "⚡";
    case "alcoholism": return "🍷";
    default: return "📦";
  }
}

export function getEffectName(effectType: "health" | "hunger" | "mood" | "alcoholism" | "energy"): string {
  switch (effectType) {
    case "health": return "Vida";
    case "hunger": return "Fome";
    case "mood": return "Humor";
    case "energy": return "Energia";
    case "alcoholism": return "Alcoolismo";
    default: return "Efeito";
  }
}

export function getCategoryName(itemType: "food" | "drink" | "object"): string {
  switch (itemType) {
    case "food": return "Comidas";
    case "drink": return "Bebidas";
    case "object": return "Objetos";
    default: return "Objetos";
  }
}