export interface StoreItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category?: string;
  itemType?: "food" | "drink" | "object"; // New field for bag categorization
  icon?: string; // Add icon property
  effect?: {
    type: "health" | "hunger" | "mood" | "alcoholism" | "energy";
    value: number;
    duration?: number; // in minutes
    message?: string;
  };
  // Relationship ring properties
  relationshipType?: "namoro" | "noivado" | "casamento" | "dating" | "engagement" | "marriage";
  relationshipPhrase?: string;
  visualEffect?: string;
  isMagical?: boolean;
  // Medicine properties
  type?: string;
  cures?: string;
}

export interface CartItem extends StoreItem {
  quantity: number;
}

export interface StoreOrder {
  id: string;
  buyerId: string;
  buyerName: string;
  storeId: string;
  items: CartItem[];
  total: number;
  status: "pending" | "approved" | "rejected";
  timestamp: Date;
}

export const STORES = {
  pharmacy: {
    id: "farmacia",
    name: "Farmácia",
    managerId: "Farmacia1212",
    items: [
      // Produtos Para Queimaduras
      {
        id: "pomada_lavanda",
        name: "Pomada Calmante de Lavanda",
        price: 30,
        description: "Alivia dor e ardência de queimaduras leves",
        category: "Produtos Para Queimaduras",
        effect: { type: "health", value: 5, message: "Sentindo alívio nas queimaduras" }
      },
      {
        id: "curativo_magico",
        name: "Curativo Mágico Termo-Selante",
        price: 75,
        description: "Protege queimaduras médias com uma camada invisível",
        category: "Produtos Para Queimaduras",
        effect: { type: "health", value: 10, message: "Proteção mágica ativada" }
      },
      {
        id: "elixir_gelo",
        name: "Elixir Refrescante de Gelo",
        price: 180,
        description: "Alívio rápido da dor e previne bolhas",
        category: "Produtos Para Queimaduras",
        type: "medicine",
        cures: "Gripe do Vento Gelado",
        effect: { type: "health", value: 15, message: "Sensação de frescor gelado" }
      },
      {
        id: "compressa_nevoa",
        name: "Compressa de Névoa Curativa",
        price: 320,
        description: "Vapor frio mágico para queimaduras graves",
        category: "Produtos Para Queimaduras",
        effect: { type: "health", value: 25, message: "Névoa curativa envolvendo as feridas" }
      },
      {
        id: "po_restaurador",
        name: "Pó Restaurador de Pele",
        price: 500,
        description: "Acelera regeneração e reduz cicatrizes",
        category: "Produtos Para Queimaduras",
        effect: { type: "health", value: 35, message: "Pele se regenerando magicamente" }
      },
      {
        id: "balsamo_mago_gelo",
        name: "Bálsamo do Mago de Gelo",
        price: 2000,
        description: "Cura rápida de queimaduras de qualquer grau",
        category: "Produtos Para Queimaduras",
        effect: { type: "health", value: 50, message: "Poder glacial curando instantaneamente" }
      },
      // Poções e Encantamentos Picantes
      {
        id: "pocao_dragao",
        name: "Poção do Dragão Vigoroso",
        price: 120,
        description: "Aumenta energia e resistência para combates noturnos",
        category: "Poções e Encantamentos Picantes",
        effect: { type: "energy", value: 25, duration: 20, message: "Sentindo vigor do dragão" }
      },
      {
        id: "elixir_lua",
        name: "Elixir da Lua Cheia",
        price: 90,
        description: "Estimula desejo e prolonga o prazer",
        category: "Poções e Encantamentos Picantes",
        effect: { type: "mood", value: 15, duration: 20, message: "Sob influência da lua cheia" }
      },
      {
        id: "pilula_trovao",
        name: "Pílula Trovão Vermelho",
        price: 110,
        description: "Desperta coragem e garante magia por horas",
        category: "Poções e Encantamentos Picantes",
        effect: { type: "energy", value: 30, duration: 25, message: "Trovão vermelho pulsando nas veias" }
      },
      // Poções de Cura e Bem-Estar
      {
        id: "essencia_calmante",
        name: "Essência do Calmante Sereno",
        price: 40,
        description: "Combate enjoo, acalma o estômago e restaura paz interior",
        category: "Poções de Cura e Bem-Estar",
        type: "medicine",
        cures: "Enjoo do Portal",
        effect: { type: "health", value: 10, message: "Serenidade tomando conta do corpo" }
      },
      {
        id: "pocao_lotus",
        name: "Poção de Lótus da Aurora",
        price: 55,
        description: "Auxilia em náuseas matinais e indisposições da gravidez",
        category: "Poções de Cura e Bem-Estar",
        effect: { type: "health", value: 12, message: "Suavidade do lótus acalmando" }
      },
      {
        id: "pomada_sabio",
        name: "Pomada do Sábio Curador",
        price: 50,
        description: "Alivia dores musculares e articulares de guerreiros veteranos",
        category: "Poções de Cura e Bem-Estar",
        type: "medicine",
        cures: "Dor Fantasma de Batalha",
        effect: { type: "health", value: 15, message: "Músculos relaxando com sabedoria antiga" }
      },
      // Itens para Bebês & Cuidados Básicos
      {
        id: "fraldas_encantadas",
        name: "Fraldas Encantadas da Fada Madrinha",
        price: 35,
        description: "Mantém o bebê seco e protegido contra assaduras mágicas",
        category: "Itens para Bebês & Cuidados Básicos"
      },
      {
        id: "chupeta_sono",
        name: "Chupeta do Sono Eterno",
        price: 30,
        description: "Garante noites tranquilas para pais cansados",
        category: "Itens para Bebês & Cuidados Básicos"
      },
      // Itens de Diagnóstico & Utilidades
      {
        id: "termometro_oraculo",
        name: "Termômetro do Oráculo",
        price: 25,
        description: "Mede febre e prevê se a gripe vai durar mais do que o esperado",
        category: "Itens de Diagnóstico & Utilidades"
      },
      {
        id: "kit_primeiros_socorros",
        name: "Kit de Primeiros Socorros do Clérigo",
        price: 60,
        description: "Tratamento rápido para pequenos ferimentos",
        category: "Itens de Diagnóstico & Utilidades",
        effect: { type: "health", value: 8, message: "Bênção do clérigo curando feridas" }
      },
      // Tratamentos Faciais
      {
        id: "creme_juventude",
        name: "Creme da Juventude Eterna",
        price: 85,
        description: "Suaviza rugas, ilumina a pele e dá aquele brilho imortal",
        category: "Tratamentos Faciais",
        effect: { type: "mood", value: 20, duration: 30, message: "Juventude eterna brilhando na pele" }
      },
      {
        id: "mascara_lua_cheia",
        name: "Máscara da Lua Cheia",
        price: 75,
        description: "Regenera a pele durante a noite, deixando-a renovada ao amanhecer",
        category: "Tratamentos Faciais",
        effect: { type: "mood", value: 15, duration: 25, message: "Renovação lunar na pele" }
      },
      {
        id: "soro_elfo",
        name: "Soro do Elfo Dourado",
        price: 90,
        description: "Uniformiza o tom de pele e hidrata profundamente",
        category: "Tratamentos Faciais",
        effect: { type: "mood", value: 18, duration: 20, message: "Graça élfica irradiando" }
      },
      // Proteção Solar & Encantamentos
      {
        id: "filtro_dragao",
        name: "Filtro Solar do Dragão Dourado",
        price: 65,
        description: "Proteção contra sol, vento e poeira mágica de batalhas",
        category: "Proteção Solar & Encantamentos"
      },
      // Hidratação & Revitalização
      {
        id: "nectar_sereias",
        name: "Néctar das Sereias",
        price: 80,
        description: "Hidrata e deixa a pele macia como escamas de sereia ao luar",
        category: "Hidratação & Revitalização",
        type: "medicine",
        cures: "Febre de Dragão",
        effect: { type: "mood", value: 12, duration: 15, message: "Suavidade das sereias" }
      },
      {
        id: "elixir_rosa",
        name: "Elixir da Rosa Encantada",
        price: 78,
        description: "Hidratação intensa com perfume suave e toque de magia",
        category: "Hidratação & Revitalização",
        effect: { type: "mood", value: 10, duration: 12, message: "Perfume encantado de rosas" }
      },
      {
        id: "agua_fonte_vida",
        name: "Água da Fonte da Vida",
        price: 50,
        description: "Tônico refrescante que devolve a vitalidade da pele",
        category: "Hidratação & Revitalização",
        effect: { type: "health", value: 5, message: "Vitalidade da fonte da vida" }
      },
      // Cuidados Especiais
      {
        id: "esfoliante_estelar",
        name: "Esfoliante Estelar",
        price: 65,
        description: "Remove células mortas e deixa a pele brilhando como constelações",
        category: "Cuidados Especiais",
        effect: { type: "mood", value: 8, duration: 10, message: "Brilho estelar na pele" }
      },
      {
        id: "balsamo_guardiao",
        name: "Bálsamo do Guardião da Floresta",
        price: 60,
        description: "Calmante para peles sensíveis, ideal pós-batalha",
        category: "Cuidados Especiais",
        effect: { type: "health", value: 8, message: "Proteção da floresta" }
      },
      {
        id: "pomada_fenix",
        name: "Pomada da Fênix",
        price: 70,
        description: "Restaura áreas ressecadas ou danificadas como se fosse renascimento",
        category: "Cuidados Especiais",
        type: "medicine",
        cures: "Pele de Pedra",
        effect: { type: "health", value: 12, message: "Renascimento da fênix" }
      },
      // Máscaras de Proteção Sobrenatural
      {
        id: "mascara_guardiao",
        name: "Máscara do Guardião Celestial",
        price: 65,
        description: "Protege contra vírus, poeira mágica e respingos de poções perigosas",
        category: "Máscaras de Proteção Sobrenatural"
      },
      {
        id: "mascara_escudo",
        name: "Máscara do Escudo Etéreo",
        price: 70,
        description: "Cria uma barreira mágica invisível contra doenças e energia negativa",
        category: "Máscaras de Proteção Sobrenatural"
      },
      {
        id: "mascara_nevoa",
        name: "Máscara da Névoa Purificadora",
        price: 68,
        description: "Filtra o ar com essência de ervas sagradas",
        category: "Máscaras de Proteção Sobrenatural",
        type: "medicine",
        cures: "Irritação de Poeira Mágica"
      },
      {
        id: "mascara_cacador",
        name: "Máscara do Caçador de Pestes",
        price: 72,
        description: "Inspirada nos antigos doutores da peste, afasta miasmas",
        category: "Máscaras de Proteção Sobrenatural"
      },
      {
        id: "mascara_luz",
        name: "Máscara da Luz Divina",
        price: 75,
        description: "Purifica cada respiração com bênçãos de cura",
        category: "Máscaras de Proteção Sobrenatural",
        type: "medicine",
        cures: "Febre da Lua Cheia"
      },
      // Géis de Proteção Mágica para as Mãos
      {
        id: "gel_clerigo",
        name: "Gel Purificador do Clérigo",
        price: 35,
        description: "Remove germes, impurezas e pequenas maldições",
        category: "Géis de Proteção Mágica para as Mãos",
        type: "medicine",
        cures: "Virose do Pó de Fada"
      },
      {
        id: "gel_chamas",
        name: "Gel das Chamas Sagradas",
        price: 38,
        description: "Limpeza intensa com calor reconfortante, elimina até maldições persistentes",
        category: "Géis de Proteção Mágica para as Mãos"
      },
      {
        id: "gel_gelido",
        name: "Gel Gélido da Neve Ancestral",
        price: 37,
        description: "Sensação refrescante e esterilização profunda",
        category: "Géis de Proteção Mágica para as Mãos"
      },
      {
        id: "gel_floral",
        name: "Gel da Essência Floral Encantada",
        price: 40,
        description: "Limpa e deixa perfume suave que acalma a alma",
        category: "Géis de Proteção Mágica para as Mãos"
      },
      {
        id: "gel_necromante",
        name: "Gel da Mão do Necromante",
        price: 39,
        description: "Esteriliza com poder das ervas negras, protege contra contaminação",
        category: "Géis de Proteção Mágica para as Mãos"
      },

      // Remédios para doenças da roleta
      {
        id: "roulette_medicine1",
        name: "Protetor Solar \"Luz de Sombra\"",
        description: "Bloqueia até a mais maligna das queimaduras solares arcanas",
        price: 70,
        category: "Remédios da Roleta",
        icon: "☀️",
        type: "medicine",
        cures: "Queimadura Solar Arcana"
      },
      {
        id: "roulette_medicine2", 
        name: "Elixir Refrescante de Gelo",
        description: "Alivia gripes causadas por ventos gelados mágicos",
        price: 180,
        category: "Remédios da Roleta", 
        icon: "❄️",
        type: "medicine",
        cures: "Gripe do Vento Gelado"
      },
      {
        id: "roulette_medicine3",
        name: "Máscara da Luz Divina", 
        description: "Purifica cada respiração com bênçãos de cura contra febres lunares",
        price: 75,
        category: "Remédios da Roleta",
        icon: "🌙",
        type: "medicine", 
        cures: "Febre da Lua Cheia"
      },
      {
        id: "roulette_medicine4",
        name: "Essência do Calmante Sereno",
        description: "Combate enjoo, acalma o estômago e restaura paz interior após viagens dimensionais", 
        price: 40,
        category: "Remédios da Roleta",
        icon: "💊",
        type: "medicine",
        cures: "Enjoo do Portal"
      },
      {
        id: "roulette_medicine5",
        name: "Gel Purificador do Clérigo",
        description: "Remove germes, impurezas e viroses causadas por pó de fada",
        price: 35,
        category: "Remédios da Roleta", 
        icon: "🧪",
        type: "medicine",
        cures: "Virose do Pó de Fada"
      },
      {
        id: "roulette_medicine6", 
        name: "Pomada do Sábio Curador",
        description: "Alivia dores musculares e fantasmas de batalhas antigas",
        price: 50,
        category: "Remédios da Roleta",
        icon: "👻", 
        type: "medicine",
        cures: "Dor Fantasma de Batalha"
      },
      {
        id: "roulette_medicine7",
        name: "Máscara da Névoa Purificadora", 
        description: "Filtra o ar com essência de ervas sagradas contra poeira mágica",
        price: 68,
        category: "Remédios da Roleta",
        icon: "✨",
        type: "medicine",
        cures: "Irritação de Poeira Mágica"
      },
      {
        id: "roulette_medicine8",
        name: "Pomada da Fênix",
        description: "Restaura áreas ressecadas ou endurecidas como se fosse renascimento", 
        price: 70,
        category: "Remédios da Roleta",
        icon: "🪨",
        type: "medicine",
        cures: "Pele de Pedra"
      },
      {
        id: "roulette_medicine9",
        name: "Néctar das Sereias",
        description: "Hidrata e refresca contra febres dracônicas intensas",
        price: 80,
        category: "Remédios da Roleta", 
        icon: "🐉",
        type: "medicine",
        cures: "Febre de Dragão"
      }
    ] as StoreItem[]
  },
  
  bar: {
    id: "bar",
    name: "Bar",
    managerId: "Bar1212",
    items: [
      // Bebidas Não-Alcoólicas
      {
        id: "refresco_pessego",
        name: "Refresco de Pêssego do Vale",
        price: 50,
        description: "Nossa, que frescor doce! Parece que acordei de um sonho bom.",
        effect: { type: "energy", value: 25, duration: 20, message: "Nossa, que frescor doce! Parece que acordei de um sonho bom." }
      },
      {
        id: "cha_gelado",
        name: "Chá Gélido da Montanha Azul",
        price: 55,
        description: "É como beber o vento da montanha... minha mente ficou clara.",
        effect: { type: "energy", value: 30, duration: 15, message: "É como beber o vento da montanha... minha mente ficou clara." }
      },
      {
        id: "leite_dourado",
        name: "Leite Dourado da Manhã",
        price: 50,
        description: "Ah... que paz. Acho que vou acabar cochilando aqui mesmo.",
        effect: { type: "energy", value: 25, duration: 25, message: "Ah... que paz. Acho que vou acabar cochilando aqui mesmo." }
      },
      // Bebidas Alcoólicas e Fortes
      {
        id: "soju_brando",
        name: "Soju Brando da Vila",
        price: 80,
        description: "Hehe... vocês são meus melhores amigos, sabia?",
        effect: { type: "alcoholism", value: 5, duration: 30, message: "Hehe... vocês são meus melhores amigos, sabia?" }
      },
      {
        id: "makgeolli_floresta",
        name: "Makgeolli da Floresta Densa",
        price: 90,
        description: "Hahaha! Até o copo parece engraçado agora.",
        effect: { type: "alcoholism", value: 10, duration: 30, message: "Hahaha! Até o copo parece engraçado agora." }
      },
      {
        id: "licor_lua",
        name: "Licor da Lua Cheia",
        price: 140,
        description: "Eu... eu te conto um segredo... mas não conta pra ninguém!",
        effect: { type: "alcoholism", value: 15, duration: 25, message: "Eu... eu te conto um segredo... mas não conta pra ninguém!" }
      },
      {
        id: "cerveja_fogo",
        name: "Cerveja do Fogo Selvagem",
        price: 130,
        description: "Arde na garganta, mas me sinto invencível!",
        effect: { type: "alcoholism", value: 12, duration: 20, message: "Arde na garganta, mas me sinto invencível!" }
      },
      {
        id: "whisky_penhasco",
        name: "Uísque do Penhasco Nebuloso",
        price: 150,
        description: "O chão... tá meio longe, ou sou eu que tô flutuando?",
        effect: { type: "alcoholism", value: 20, duration: 25, message: "O chão... tá meio longe, ou sou eu que tô flutuando?" }
      },
      {
        id: "espirito_dragao",
        name: "Espírito de Dragão",
        price: 200,
        description: "HAA! Eu posso enfrentar até um dragão agora!",
        effect: { type: "alcoholism", value: 30, duration: 20, message: "HAA! Eu posso enfrentar até um dragão agora!" }
      },
      {
        id: "sangue_salamandra",
        name: "Sangue de Salamandra",
        price: 180,
        description: "AGHH! Tá queimando tudo por dentro... mas eu adoro!",
        effect: { type: "alcoholism", value: 22, duration: 20, message: "AGHH! Tá queimando tudo por dentro... mas eu adoro!" }
      },
      // Bebidas Encantadas
      {
        id: "cha_sussurro_nuvem",
        name: "Chá Sussurro de Nuvem",
        price: 10,
        description: "É como se eu estivesse deitado numa nuvem macia...",
        effect: { type: "mood", value: 10, duration: 25, message: "É como se eu estivesse deitado numa nuvem macia..." }
      },
      {
        id: "saque_vento_preso",
        name: "Saquê do Vento Preso",
        price: 20,
        description: "Ugh... tem algo preso aqui... espera... PUFF!",
        effect: { type: "mood", value: 12, duration: 15, message: "Ugh... tem algo preso aqui... espera... PUFF!" }
      },
      {
        id: "licor_pulmoes_soltos",
        name: "Licor dos Pulmões Soltos",
        price: 25,
        description: "Ahahaha! Não aguento, vai sair... BUUURP!",
        effect: { type: "mood", value: 12, duration: 20, message: "Ahahaha! Não aguento, vai sair... BUUURP!" }
      },
      {
        id: "soju_espirito_brando",
        name: "Soju do Espírito Brando",
        price: 30,
        description: "Hihihi... você ficou lindo(a) de repente...",
        effect: { type: "alcoholism", value: 6, duration: 25, message: "Hihihi... você ficou lindo(a) de repente..." }
      },
      {
        id: "makgeolli_lua_risonha",
        name: "Makgeolli da Lua Risonha",
        price: 35,
        description: "HAHAHA! Até a cadeira tá rindo comigo!",
        effect: { type: "alcoholism", value: 7, duration: 20, message: "HAHAHA! Até a cadeira tá rindo comigo!" }
      },
      {
        id: "agua_ardente_dragao_dourado",
        name: "Água Ardente do Dragão Dourado",
        price: 50,
        description: "Com isso... eu sou imparável! Nada pode me deter!",
        effect: { type: "alcoholism", value: 10, duration: 20, message: "Com isso... eu sou imparável! Nada pode me deter!" }
      },
      {
        id: "elixir_desejos",
        name: "Elixir dos Desejos",
        price: 150,
        description: "Eu... estou vendo... o que mais quero neste mundo!",
        effect: { type: "mood", value: 30, duration: 15, message: "Eu... estou vendo... o que mais quero neste mundo!" }
      }
    ] as StoreItem[]
  },

  restaurant: {
    id: "restaurante", 
    name: "Restaurante",
    managerId: "Restaurante1212",
    items: [
      // Pratos Principais
      {
        id: "bibimbap",
        name: "Bibimbap Encantado",
        price: 100,
        description: "Prato coreano que ativa runas de concentração",
        category: "Pratos Principais",
        effect: { type: "hunger", value: 50, duration: 15, message: "Ao misturar os ingredientes, ativa uma runa que aumenta a concentração e foco." }
      },
      {
        id: "tteokbokki",
        name: "Tteokbokki de Fogo Fátuo",
        price: 160,
        description: "Massinha picante com resistência ao frio",
        category: "Pratos Principais",
        effect: { type: "hunger", value: 80, duration: 20, message: "Picância mágica que aquece o corpo e concede leve resistência ao frio." }
      },
      {
        id: "jjajangmyeon",
        name: "Jjajangmyeon Sombrio",
        price: 200,
        description: "Macarrão que sussurra segredos antigos",
        category: "Pratos Principais",
        effect: { type: "hunger", value: 25, duration: 5, message: "Vozes antigas sussurram dicas e enigmas na mente de quem come." }
      },
      {
        id: "galbi_dragao",
        name: "Galbi de Dragão Jovem",
        price: 280,
        description: "Costela que reforça a energia vital",
        category: "Pratos Principais",
        effect: { type: "hunger", value: 100, duration: 25, message: "Reforça temporariamente a energia vital, deixando o corpo mais forte." }
      },
      {
        id: "kimchi_despertar",
        name: "Kimchi do Despertar",
        price: 100,
        description: "Kimchi que clareia a mente e afasta pesadelos",
        category: "Pratos Principais",
        effect: { type: "hunger", value: 50, duration: 10, message: "Clareia a mente, afasta pesadelos e fortalece a resistência mental." }
      },
      
      // Sopas & Guisados
      {
        id: "sundubu",
        name: "Sundubu Celestial", 
        price: 100,
        description: "Sopa que proporciona leveza e bem-estar",
        category: "Sopas & Guisados",
        effect: { type: "hunger", value: 50, duration: 15, message: "Proporciona sensação de leveza e bem-estar, reduzindo o cansaço." }
      },
      {
        id: "samgyetang",
        name: "Samgyetang das Quatro Estações",
        price: 150,
        description: "Sopa que adapta o corpo ao clima",
        category: "Sopas & Guisados",
        effect: { type: "health", value: 20, duration: 20, message: "Adapta o corpo ao clima atual (menos calor no verão, mais resistência no frio)." }
      },
      
      // Acompanhamentos Mágicos
      {
        id: "paezinhos_ar",
        name: "Pãezinhos de Ar Leve",
        price: 20,
        description: "Pãezinhos que aumentam agilidade",
        category: "Acompanhamentos Mágicos",
        effect: { type: "hunger", value: 15, duration: 5, message: "Ao comer, o corpo fica levemente mais ágil." }
      },
      {
        id: "ovos_roc",
        name: "Ovos de Roc Flamejante",
        price: 150,
        description: "Ovos que concedem resistência mágica",
        category: "Acompanhamentos Mágicos",
        effect: { type: "hunger", value: 75, duration: 15, message: "Aumenta a resistência mágica contra feitiços diretos." }
      },
      {
        id: "picles_cintilantes",
        name: "Picles Cintilantes",
        price: 50,
        description: "Picles que melhoram recuperação de energia",
        category: "Acompanhamentos Mágicos",
        effect: { type: "hunger", value: 25, duration: 10, message: "Refresca e melhora a recuperação de energia." }
      },
      
      // Sobremesas
      {
        id: "bingsu",
        name: "Bingsu Estelar",
        price: 100,
        description: "Sobremesa que inspira alegria e criatividade",
        category: "Sobremesas",
        effect: { type: "hunger", value: 50, duration: 10, message: "Cada colher inspira alegria e criatividade." }
      },
      {
        id: "hotteok",
        name: "Hotteok de Brasa Doce",
        price: 50,
        description: "Panqueca que aquece o coração",
        category: "Sobremesas",
        effect: { type: "hunger", value: 25, duration: 5, message: "Aquece o coração, recuperando um pouco da energia perdida." }
      },
      
      // Bebidas Encantadas
      {
        id: "cha_flor_lunar",
        name: "Chá de Flor Lunar",
        price: 100,
        description: "Chá que facilita meditação e foco mágico",
        category: "Bebidas Encantadas",
        effect: { type: "hunger", value: 3, duration: 20, message: "Acalma os pensamentos e facilita meditação ou foco mágico." }
      },
      {
        id: "suco_fruta_fantasma",
        name: "Suco de Fruta Fantasma",
        price: 100,
        description: "Suco que reanima o espírito",
        category: "Bebidas Encantadas",
        effect: { type: "hunger", value: 3, duration: 15, message: "Reanima o espírito, trazendo uma sensação refrescante e leve." }
      },
      {
        id: "vinho_cerejeira",
        name: "Vinho de Cerejeira Noturna",
        price: 80,
        description: "Vinho que causa leve flutuação",
        category: "Bebidas Encantadas",
        effect: { type: "hunger", value: 3, duration: 0.5, message: "Causa leve flutuação do corpo, como se estivesse em sonho." }
      }
    ] as StoreItem[]
  },

  pizzeria: {
    id: "pizzaria",
    name: "Pizzaria",
    managerId: "Pizzaria1212",
    items: [
      // Pizzas Salgadas Normais
      {
        id: "classica_aurora",
        name: "Clássica Aurora",
        price: 45,
        description: "Simples, mas divina... o sabor da tradição.",
        category: "Pizzas Salgadas Normais",
        effect: { type: "hunger", value: 22, duration: 20, message: "Simples, mas divina... o sabor da tradição." }
      },
      {
        id: "reino_calabresa",
        name: "Reino da Calabresa",
        price: 48,
        description: "Picante na medida certa, dá até vontade de cantar vitória!",
        category: "Pizzas Salgadas Normais",
        effect: { type: "hunger", value: 24, duration: 15, message: "Picante na medida certa, dá até vontade de cantar vitória!" }
      },
      {
        id: "quatro_queijos_corte",
        name: "Quatro Queijos da Corte",
        price: 52,
        description: "Cada mordida é uma realeza de sabores!",
        category: "Pizzas Salgadas Normais",
        effect: { type: "hunger", value: 26, duration: 20, message: "Cada mordida é uma realeza de sabores!" }
      },
      {
        id: "jardim_verde",
        name: "Jardim Verde",
        price: 46,
        description: "Refrescante... como se eu estivesse no meio de um campo verdejante.",
        category: "Pizzas Salgadas Normais",
        effect: { type: "hunger", value: 23, duration: 15, message: "Refrescante... como se eu estivesse no meio de um campo verdejante." }
      },
      {
        id: "fazenda_encantada",
        name: "Fazenda Encantada",
        price: 50,
        description: "Sabor de lar... como um abraço da fazenda.",
        category: "Pizzas Salgadas Normais",
        effect: { type: "hunger", value: 25, duration: 20, message: "Sabor de lar... como um abraço da fazenda." }
      },

      // Pizzas Salgadas Mágicas
      {
        id: "chama_dragonica",
        name: "Chama Dragônica",
        price: 65,
        description: "Minha boca tá pegando fogo... mas é delicioso!",
        category: "Pizzas Salgadas Mágicas",
        isMagical: true,
        effect: { type: "hunger", value: 32, duration: 10, message: "Minha boca tá pegando fogo... mas é delicioso!" }
      },
      {
        id: "vento_colinas",
        name: "Vento das Colinas",
        price: 62,
        description: "Quentinha até a última fatia... parece mágica!",
        category: "Pizzas Salgadas Mágicas",
        isMagical: true,
        effect: { type: "hunger", value: 25, duration: 15, message: "Quentinha até a última fatia... parece mágica!" }
      },
      {
        id: "nevoa_noite",
        name: "Névoa da Noite",
        price: 68,
        description: "Esse aroma... é misterioso e doce ao mesmo tempo.",
        category: "Pizzas Salgadas Mágicas",
        isMagical: true,
        effect: { type: "hunger", value: 30, duration: 20, message: "Esse aroma... é misterioso e doce ao mesmo tempo." }
      },
      {
        id: "fogo_mago",
        name: "Fogo do Mago",
        price: 70,
        description: "Olha só, a massa brilha! É como comer feitiçaria.",
        category: "Pizzas Salgadas Mágicas",
        isMagical: true,
        effect: { type: "hunger", value: 30, duration: 15, message: "Olha só, a massa brilha! É como comer feitiçaria." }
      },
      {
        id: "ateez_arriba",
        name: "Ateez Arriba",
        price: 75,
        description: "Uhuu! Essa energia subiu direto pra alma!",
        category: "Pizzas Salgadas Mágicas",
        isMagical: true,
        effect: { type: "hunger", value: 35, duration: 20, message: "Uhuu! Essa energia subiu direto pra alma!" }
      },

      // Pizzas Doces Normais
      {
        id: "estrela_chocolate",
        name: "Estrela de Chocolate",
        price: 55,
        description: "Derrete na boca... parece doce dos deuses.",
        category: "Pizzas Doces Normais",
        effect: { type: "hunger", value: 25, duration: 15, message: "Derrete na boca... parece doce dos deuses." }
      },
      {
        id: "canela_sonhos",
        name: "Canela dos Sonhos",
        price: 52,
        description: "Quentinho e doce... dá até vontade de dormir sorrindo.",
        category: "Pizzas Doces Normais",
        effect: { type: "hunger", value: 25, duration: 20, message: "Quentinho e doce... dá até vontade de dormir sorrindo." }
      },
      {
        id: "tentacao_morango",
        name: "Tentação de Morango",
        price: 58,
        description: "Doce e delicada... impossível resistir.",
        category: "Pizzas Doces Normais",
        effect: { type: "hunger", value: 25, duration: 15, message: "Doce e delicada... impossível resistir." }
      },

      // Pizzas Doces Mágicas
      {
        id: "aurora_acucarada",
        name: "Aurora Açucarada",
        price: 72,
        description: "Está brilhando no escuro... que incrível!",
        category: "Pizzas Doces Mágicas",
        isMagical: true,
        effect: { type: "hunger", value: 30, duration: 5, message: "Está brilhando no escuro... que incrível!" }
      },
      {
        id: "luar_mel",
        name: "Luar de Mel",
        price: 68,
        description: "Tão doce que parece um feitiço de paz.",
        category: "Pizzas Doces Mágicas",
        isMagical: true,
        effect: { type: "hunger", value: 30, duration: 20, message: "Tão doce que parece um feitiço de paz." }
      },
      {
        id: "frutas_arco_iris",
        name: "Frutas do Arco-Íris",
        price: 75,
        description: "Cada mordida... um sabor novo! Que divertido!",
        category: "Pizzas Doces Mágicas",
        isMagical: true,
        effect: { type: "hunger", value: 35, duration: 20, message: "Cada mordida... um sabor novo! Que divertido!" }
      },

      // Bebidas
      {
        id: "refrigerante",
        name: "Refrigerante (Cola, Guaraná, Limão)",
        price: 8,
        description: "Refrescante, dá até gás pra continuar o dia.",
        category: "Bebidas",
        itemType: "drink",
        effect: { type: "energy", value: 15, duration: 10, message: "Refrescante, dá até gás pra continuar o dia." }
      },
      {
        id: "suco_natural",
        name: "Suco Natural (Laranja, Maracujá, Uva)",
        price: 10,
        description: "Natural e delicioso... como um gole de vida.",
        category: "Bebidas",
        itemType: "drink",
        effect: { type: "energy", value: 18, duration: 15, message: "Natural e delicioso... como um gole de vida." }
      },
      {
        id: "suco_encantado",
        name: "Suco Encantado",
        price: 15,
        description: "Uau! Mudou de sabor com meu humor... isso é mágico!",
        category: "Bebidas",
        itemType: "drink",
        isMagical: true,
        effect: { type: "energy", value: 22, duration: 20, message: "Uau! Mudou de sabor com meu humor... isso é mágico!" }
      },
      {
        id: "refresco_mago",
        name: "Refresco do Mago",
        price: 18,
        description: "Esse frescor mágico na boca é viciante!",
        category: "Bebidas",
        itemType: "drink",
        isMagical: true,
        effect: { type: "energy", value: 20, duration: 15, message: "Esse frescor mágico na boca é viciante!" }
      }
    ] as StoreItem[]
  },

  icecream: {
    id: "sorveteria",
    name: "Sorveteria",
    managerId: "Sorveteria1212", 
    items: [
      // Sorvetes Tradicionais
      {
        id: "baunilha_sonhos",
        name: "Baunilha dos Sonhos",
        price: 15,
        description: "Sorvete clássico que acalma a alma",
        category: "Sorvetes Tradicionais",
        itemType: "food",
        icon: "🍦",
        effect: { type: "hunger", value: 15, duration: 15, message: "É como um abraço doce na alma..." }
      },
      {
        id: "chocolate_feiticeiro",
        name: "Chocolate Feiticeiro",
        price: 18,
        description: "Chocolate com poderes mágicos",
        category: "Sorvetes Tradicionais",
        itemType: "food",
        icon: "🍫",
        effect: { type: "mood", value: 18, duration: 20, message: "Esse chocolate... parece ter magia própria!" }
      },
      {
        id: "morango_encantado",
        name: "Morango Encantado",
        price: 18,
        description: "Morango doce que desperta o amor",
        category: "Sorvetes Tradicionais",
        itemType: "food",
        icon: "🍓",
        effect: { type: "mood", value: 18, duration: 15, message: "Tão doce que sinto como se estivesse apaixonado(a)." }
      },
      {
        id: "napolitano",
        name: "Napolitano",
        price: 20,
        description: "Três sabores em perfeita harmonia",
        category: "Sorvetes Tradicionais",
        itemType: "food",
        icon: "🍨",
        effect: { type: "hunger", value: 20, duration: 20, message: "Impossível escolher o melhor, cada colher é uma surpresa." }
      },
      {
        id: "creme_caramelo",
        name: "Creme de Caramelo",
        price: 20,
        description: "Creme cremoso com caramelo dourado",
        category: "Sorvetes Tradicionais",
        itemType: "food",
        icon: "🍮",
        effect: { type: "mood", value: 20, duration: 25, message: "Derrete na boca como se fosse pura felicidade..." }
      },

      // Sorvetes Mágicos
      {
        id: "menta_explosiva",
        name: "Menta Explosiva",
        price: 25,
        description: "Explosão refrescante de sabor",
        category: "Sorvetes Mágicos",
        itemType: "food",
        icon: "🌿",
        effect: { type: "energy", value: 25, duration: 10, message: "Woaah! Parece que minha boca virou um festival de fogos gelados!" }
      },
      {
        id: "creme_nuvens",
        name: "Creme das Nuvens",
        price: 30,
        description: "Leve como nuvens do céu",
        category: "Sorvetes Mágicos",
        itemType: "food",
        icon: "☁️",
        effect: { type: "mood", value: 30, duration: 15, message: "Estou comendo nuvens... tão leve que quase flutuo." }
      },
      {
        id: "frutas_arco_iris",
        name: "Frutas do Arco-Íris",
        price: 32,
        description: "Muda de sabor a cada lambida",
        category: "Sorvetes Mágicos",
        itemType: "food",
        icon: "🌈",
        effect: { type: "mood", value: 32, duration: 20, message: "Cada lambida é uma aventura diferente!" }
      },
      {
        id: "estelar_mirtilo",
        name: "Estelar de Mirtilo",
        price: 35,
        description: "Azul brilhante que faz a língua cintilar",
        category: "Sorvetes Mágicos",
        itemType: "food",
        icon: "🫐",
        effect: { type: "energy", value: 35, duration: 5, message: "Minha língua... tá brilhando! Hahaha!" }
      },
      {
        id: "doce_crepusculo",
        name: "Doce do Crepúsculo",
        price: 38,
        description: "Sorvete mágico com sabor de pôr do sol",
        category: "Sorvetes Mágicos",
        itemType: "food",
        icon: "🌅",
        effect: { type: "mood", value: 38, duration: 20, message: "Tem gosto de magia... como se fosse o pôr do sol em forma de sorvete." }
      },

      // Milk-Shakes
      {
        id: "shake_classico",
        name: "Shake Clássico",
        price: 28,
        description: "O bom e velho shake tradicional",
        category: "Milk-Shakes",
        itemType: "drink",
        icon: "🥤",
        effect: { type: "hunger", value: 28, duration: 20, message: "Ahh... nada como o bom e velho shake." }
      },
      {
        id: "shake_duplo",
        name: "Shake Duplo Sabor",
        price: 32,
        description: "Dois sabores em perfeita harmonia",
        category: "Milk-Shakes",
        itemType: "drink",
        icon: "🥤",
        effect: { type: "energy", value: 32, duration: 20, message: "Dois sabores, um só shake... perfeito!" }
      },
      {
        id: "shake_encantado",
        name: "Shake Encantado",
        price: 38,
        description: "Shake que muda de cor magicamente",
        category: "Milk-Shakes",
        itemType: "drink",
        icon: "🥤",
        effect: { type: "mood", value: 38, duration: 15, message: "Olha só, ele muda de cor... que incrível!" }
      },
      {
        id: "shake_gelido",
        name: "Shake Gélido",
        price: 40,
        description: "Tão gelado que congela a respiração",
        category: "Milk-Shakes",
        itemType: "drink",
        icon: "🧊",
        effect: { type: "energy", value: 40, duration: 10, message: "Uuuuh! Até minha respiração ficou gelada!" }
      },
      {
        id: "shake_supremo",
        name: "Shake Supremo",
        price: 45,
        description: "O shake mais especial da casa",
        category: "Milk-Shakes",
        itemType: "drink",
        icon: "👑",
        effect: { type: "mood", value: 45, duration: 25, message: "Esse é digno dos deuses... maravilhoso!" }
      },

      // Açaí
      {
        id: "acai_tropical",
        name: "Açaí Tropical",
        price: 30,
        description: "Açaí refrescante com frutas tropicais",
        category: "Açaí",
        itemType: "food",
        icon: "🫐",
        effect: { type: "energy", value: 20, duration: 20, message: "Refrescante e cheio de vida... combina com verão." }
      },
      {
        id: "acai_supremo",
        name: "Açaí Supremo",
        price: 38,
        description: "Açaí especial que brilha magicamente",
        category: "Açaí",
        itemType: "food",
        icon: "✨",
        effect: { type: "mood", value: 38, duration: 25, message: "Até brilha... parece uma poção deliciosa." }
      },
      {
        id: "acai_energetico",
        name: "Açaí Energético",
        price: 45,
        description: "Açaí que restaura energia instantaneamente",
        category: "Açaí",
        itemType: "food",
        icon: "⚡",
        effect: { type: "energy", value: 45, duration: 5, message: "Uau! Tô pronto(a) pra qualquer missão agora!" }
      },
      {
        id: "acai_chocolate",
        name: "Açaí com Chocolate",
        price: 35,
        description: "Combinação perfeita de açaí e chocolate",
        category: "Açaí",
        itemType: "food",
        icon: "🍫",
        effect: { type: "hunger", value: 20, duration: 15, message: "A mistura perfeita... doce e forte ao mesmo tempo." }
      },
      {
        id: "acai_encantado",
        name: "Açaí Encantado",
        price: 42,
        description: "Açaí mágico que surpreende a cada colherada",
        category: "Açaí",
        itemType: "food",
        icon: "🔮",
        effect: { type: "mood", value: 25, duration: 20, message: "Cada colher é uma surpresa diferente... adoro!" }
      },

      // Crepes
      {
        id: "crepe_explosao_sabores",
        name: "Crepe Explosão de Sabores",
        price: 30,
        description: "Uma deliciosa massa de chocolate branco ou preto, com sorvete de baunilha, morango ou chocolate. Acrescido de biscoito crocante e frutas.",
        category: "Crepes",
        itemType: "food",
        icon: "🥞",
        effect: { type: "mood", value: 30, duration: 20, message: "Que explosão de sabores! Me sinto nas nuvens de felicidade!" }
      },

      // Milkshakes Especiais
      {
        id: "milkshake_churros",
        name: "Milkshake de Churros",
        price: 45,
        description: "Milkshake tradicional de baunilha com calda de churros junto de uma bandejinha de churros fritos na hora.",
        category: "Milk-Shakes",
        itemType: "drink",
        icon: "🥤",
        effect: { type: "hunger", value: 50, duration: 30, message: "Que delícia! Os churros quentinhos com o milkshake gelado... perfeição!" }
      },
      {
        id: "milkshake_pinky",
        name: "Milkshake Pinky",
        price: 30,
        description: "Feito para os amantes da cor rosa e as patricinhas de plantão, um delicioso sorvete de morango com oreo rosa.",
        category: "Milk-Shakes",
        itemType: "drink",
        icon: "🌸",
        effect: { type: "hunger", value: 30, duration: 20, message: "Tão fofo e rosa! Me sinto uma princesa tomando isso!" }
      },

      // Smoothies
      {
        id: "smoothie_frutas_vermelhas",
        name: "Smoothie de Frutas Vermelhas",
        price: 15,
        description: "Uma bebida cremosa e doce, feita de frutas congeladas",
        category: "Smoothies",
        itemType: "drink",
        icon: "🍓",
        effect: { type: "energy", value: 15, duration: 15, message: "Que refrescante! As frutas vermelhas dão uma energia incrível!" }
      },
      {
        id: "smoothie_manga",
        name: "Smoothie de Manga",
        price: 18,
        description: "Uma bebida cremosa de manga congelada e raspas de chocolate.",
        category: "Smoothies",
        itemType: "drink",
        icon: "🥭",
        effect: { type: "energy", value: 18, duration: 15, message: "A manga tropical com chocolate... que combinação perfeita!" }
      },

      // Sobremesas
      {
        id: "brownie_sorvete",
        name: "Brownie com Sorvete",
        price: 50,
        description: "Um brownie macio e quentinho de chocolate belga, com uma grande e generosa bola de sorvete de creme com calda de chocolate e morangos picados",
        category: "Sobremesas",
        itemType: "food",
        icon: "🍰",
        effect: { type: "mood", value: 40, duration: 25, message: "Que brownie divino! O contraste do quente com o gelado é pura felicidade!" }
      },

      // Sorvetes de Rolo
      {
        id: "sorvete_lavanda",
        name: "Sorvete Lavanda",
        price: 20,
        description: "Um sabor diferente e doce, com cheiro floral de lavanda junto de uma camada de Chantilly e flor de açúcar",
        category: "Sorvetes de Rolo",
        itemType: "food",
        icon: "🌸",
        effect: { type: "mood", value: 20, duration: 15, message: "Que aroma relaxante... a lavanda acalma minha alma!" }
      },
      {
        id: "licor_rolo",
        name: "Licor em Rolo",
        price: 40,
        description: "Um sorvete alcoólico com o sabor intenso do licor de chocolate",
        category: "Sorvetes de Rolo",
        itemType: "food",
        icon: "🍫",
        effect: { type: "alcoholism", value: 25, duration: 20, message: "Mmm... esse licor de chocolate tem um sabor único e intenso!" }
      },
      {
        id: "ice_moscow_mule",
        name: "Ice Moscow Mule",
        price: 30,
        description: "Um sorvete alcoólico com Chantilly de limão, um sorvete feito com baunilha, gengibre e raspas de limão.",
        category: "Sorvetes de Rolo",
        itemType: "food",
        icon: "🍋",
        effect: { type: "alcoholism", value: 20, duration: 15, message: "Que combinação refrescante! O gengibre com limão é surpreendente!" }
      },
      {
        id: "rolo_napolitano",
        name: "Rolo Napolitano",
        price: 28,
        description: "Tradicional sorvete napolitano em rolos, com biscoitos crocantes de chocolate, morangos picados e calda de morango",
        category: "Sorvetes de Rolo",
        itemType: "food",
        icon: "🍨",
        effect: { type: "hunger", value: 28, duration: 20, message: "O clássico napolitano em formato de rolo... que inovação deliciosa!" }
      },

      // Sorvetes Especiais
      {
        id: "sorvete_algodao_doce",
        name: "Sorvete de Algodão Doce",
        price: 45,
        description: "Para os amantes de açúcar, um sorvete colorido com um algodão doce azul, branco e rosa por cima",
        category: "Sorvetes Especiais",
        itemType: "food",
        icon: "🍭",
        effect: { type: "energy", value: 35, duration: 10, message: "Tanto açúcar! Me sinto como uma criança na festa junina!" }
      },
      {
        id: "sorvete_caipirinha",
        name: "Sorvete Caipirinha",
        price: 45,
        description: "Um sorvete de limão ou maracujá, com teor alcoólico, vindo em um belo copo, com frutas picadas, biscoitos e Chantilly.",
        category: "Sorvetes Especiais",
        itemType: "food",
        icon: "🍹",
        effect: { type: "mood", value: 35, duration: 20, message: "Que refrescante! Me sinto num clima de praia e festa!" }
      }
    ] as StoreItem[]
  },

  jewelry: {
    id: "joalheria",
    name: "Joalheria",
    managerId: "Joalheria1212",
    items: [
      // Anéis de Namoro
      {
        id: "anel_alvorecer",
        name: "Doce Alvorecer",
        price: 320,
        description: "Quero começar um novo amanhecer ao seu lado... aceita namorar comigo?",
        category: "Anéis de Namoro",
        relationshipType: "dating",
        relationshipPhrase: "Quero começar um novo amanhecer ao seu lado... aceita namorar comigo?",
        visualEffect: "O coração do casal bate em sintonia por alguns segundos, causando leve brilho rosado ao redor (dura 1 min).",
        icon: "💍"
      },
      {
        id: "anel_lua_amor",
        name: "Lua do Amor",
        price: 450,
        description: "Assim como a lua ilumina a noite, você ilumina minha vida... aceita namorar comigo?",
        category: "Anéis de Namoro",
        relationshipType: "dating",
        relationshipPhrase: "Assim como a lua ilumina a noite, você ilumina minha vida... aceita namorar comigo?",
        visualEffect: "Um reflexo prateado surge no ar, lembrando o luar, envolvendo o casal por breves instantes.",
        icon: "💍"
      },
      {
        id: "anel_suspiro",
        name: "Suspiro Encantado",
        price: 700,
        description: "Cada suspiro meu pede por você... aceita ser meu/minha namorado(a)? (MÁGICO)",
        category: "Anéis de Namoro",
        relationshipType: "dating",
        relationshipPhrase: "Cada suspiro meu pede por você... aceita ser meu/minha namorado(a)?",
        visualEffect: "O anel libera um aroma de flores doces que relaxa e aquece o ambiente, deixando o clima romântico por 3 min.",
        isMagical: true,
        icon: "💍"
      },
      // Anéis de Noivado
      {
        id: "anel_flor_paixao",
        name: "Flor da Paixão",
        price: 1250,
        description: "Nosso amor floresceu... e quero que dure para sempre. Aceita noivar comigo?",
        category: "Anéis de Noivado",
        relationshipType: "engagement",
        relationshipPhrase: "Nosso amor floresceu... e quero que dure para sempre. Aceita noivar comigo?",
        visualEffect: "Um rubor quente e confortável envolve o casal, como pétalas invisíveis caindo sobre eles.",
        icon: "💍"
      },
      {
        id: "anel_estrelas",
        name: "Luz das Estrelas",
        price: 1600,
        description: "Com você, meu céu sempre terá estrelas... aceita ser meu/minha noivo(a)?",
        category: "Anéis de Noivado",
        relationshipType: "engagement",
        relationshipPhrase: "Com você, meu céu sempre terá estrelas... aceita ser meu/minha noivo(a)?",
        visualEffect: "Pequenos brilhos cintilantes aparecem ao redor por alguns segundos, como uma chuva de estrelas.",
        icon: "💍"
      },
      {
        id: "anel_inquebravel",
        name: "Laço Inquebrável",
        price: 2050,
        description: "Meu coração já é ligado ao seu... aceita selar esse laço comigo para sempre? (MÁGICO)",
        category: "Anéis de Noivado",
        relationshipType: "engagement",
        relationshipPhrase: "Meu coração já é ligado ao seu... aceita selar esse laço comigo para sempre?",
        visualEffect: "Os anéis aquecem suavemente no dedo, criando uma conexão mágica: ambos sentem um calor aconchegante sempre que pensam um no outro (efeito permanente).",
        isMagical: true,
        icon: "💍"
      },
      // Anéis de Casamento
      {
        id: "anel_aurora_dourada",
        name: "Aurora Dourada",
        price: 2400,
        description: "Quero compartilhar todas as auroras da minha vida com você. Aceita se casar comigo?",
        category: "Anéis de Casamento",
        relationshipType: "marriage",
        relationshipPhrase: "Quero compartilhar todas as auroras da minha vida com você. Aceita se casar comigo?",
        visualEffect: "Um brilho dourado envolve o casal por alguns segundos, como se o sol estivesse nascendo só para eles.",
        icon: "💍"
      },
      {
        id: "anel_dois_coracoes",
        name: "Dois Corações",
        price: 3000,
        description: "Dois corações, uma só vida... aceita casar comigo?",
        category: "Anéis de Casamento",
        relationshipType: "marriage",
        relationshipPhrase: "Dois corações, uma só vida... aceita casar comigo?",
        visualEffect: "Um leve som de batimentos cardíacos ecoa no ar, sincronizando os dois corações por instantes.",
        icon: "💍"
      },
      {
        id: "anel_promessa_eterna",
        name: "Promessa Eterna",
        price: 4300,
        description: "Prometo estar com você até o fim dos tempos... aceita ser meu/minha para sempre? (MÁGICO)",
        category: "Anéis de Casamento",
        relationshipType: "marriage",
        relationshipPhrase: "Prometo estar com você até o fim dos tempos... aceita ser meu/minha para sempre?",
        visualEffect: "O diamante brilha intensamente quando o casal se toca, deixando um resplendor mágico permanente sempre que as mãos se encontram.",
        isMagical: true,
        icon: "💍"
      },

      // Anéis
      {
        id: "anel_laco_inquebravel_amizade",
        name: "Laço Inquebrável",
        price: 1200,
        description: "Anel que simboliza amizade eterna e inquebrantável",
        category: "Anéis",
        relationshipType: "friendship",
        icon: "💍",
        itemType: "object"
      },

      // Pulseiras
      {
        id: "pulseira_flores_primavera",
        name: "Flores de primavera",
        price: 1400,
        description: "Pulseira delicada com flores que florescem eternamente",
        category: "Pulseiras",
        icon: "🌸",
        itemType: "object"
      },
      {
        id: "pulseira_laco_amizade",
        name: "Laço de amizade",
        price: 1800,
        description: "Pulseira que conecta almas de verdadeiros parceiros",
        category: "Pulseiras",
        relationshipType: "friendship",
        icon: "🤝",
        itemType: "object"
      },
      {
        id: "pulseira_amor_dois",
        name: "Amor a dois",
        price: 2500,
        description: "Pulseira que celebra o amor compartilhado",
        category: "Pulseiras",
        relationshipType: "dating",
        icon: "💝",
        itemType: "object"
      },
      {
        id: "pulseira_eclipse_eterno",
        name: "Eclipse eterno",
        price: 3200,
        description: "Pulseira que simboliza o encontro perfeito de duas almas",
        category: "Pulseiras",
        relationshipType: "dating",
        icon: "🌒",
        itemType: "object"
      },

      // Brincos
      {
        id: "brincos_reliquias_preciosas",
        name: "Relíquias preciosas",
        price: 2000,
        description: "Brincos únicos que carregam histórias antigas",
        category: "Brincos",
        icon: "💎",
        itemType: "object"
      },
      {
        id: "brincos_correntes_alternativas",
        name: "Correntes alternativas",
        price: 1500,
        description: "Brincos modernos com correntes elegantes",
        category: "Brincos",
        icon: "⛓️",
        itemType: "object"
      },
      {
        id: "brincos_natureza_brilhante",
        name: "Natureza brilhante",
        price: 2400,
        description: "Brincos que capturam a essência da natureza em cristais",
        category: "Brincos",
        icon: "🌿",
        itemType: "object"
      },

      // Colares
      {
        id: "colar_futuro_partilhado",
        name: "Futuro partilhado",
        price: 3500,
        description: "Colar que simboliza um futuro construído a dois",
        category: "Colares",
        relationshipType: "dating",
        icon: "🔮",
        itemType: "object"
      },
      {
        id: "colar_estrela_diamantes",
        name: "Estrela dos diamantes",
        price: 2800,
        description: "Colar com uma estrela que brilha como diamantes",
        category: "Colares",
        icon: "⭐",
        itemType: "object"
      },
      {
        id: "colar_dois_amigos",
        name: "Dois amigos",
        price: 1900,
        description: "Colar para celebrar as melhores aventuras entre amigos",
        category: "Colares",
        relationshipType: "friendship",
        icon: "🎭",
        itemType: "object"
      },

      // Relógios Mágicos
      {
        id: "relogio_tic_tac_destino",
        name: "Tic-Tac do Destino",
        price: 2600,
        description: "Relógio que marca os momentos mais importantes da vida",
        category: "Relógios Mágicos",
        icon: "⏰",
        itemType: "object"
      },
      {
        id: "relogio_lacos_eternos",
        name: "Laços Eternos",
        price: 3000,
        description: "Relógio que marca o tempo de uma amizade sem fim",
        category: "Relógios Mágicos",
        relationshipType: "friendship",
        icon: "⏰",
        itemType: "object"
      },
      {
        id: "relogio_coracoes_sincronizados",
        name: "Corações Sincronizados",
        price: 3800,
        description: "Relógio que sincroniza os batimentos cardíacos dos amantes",
        category: "Relógios Mágicos",
        relationshipType: "dating",
        icon: "💕",
        itemType: "object"
      },

      // Alfinetes
      {
        id: "alfinete_elegancia_discreta",
        name: "Elegância discreta",
        price: 1000,
        description: "Alfinete sutil que adiciona um toque de classe",
        category: "Alfinetes",
        icon: "📍",
        itemType: "object"
      },
      {
        id: "alfinete_presente_especial",
        name: "Presente especial",
        price: 1300,
        description: "Alfinete único para ocasiões memoráveis",
        category: "Alfinetes",
        icon: "🎁",
        itemType: "object"
      },
      {
        id: "alfinete_brilhos_noite",
        name: "Brilhos da noite",
        price: 1600,
        description: "Alfinete que captura a magia das noites estreladas",
        category: "Alfinetes",
        icon: "✨",
        itemType: "object"
      }
    ] as StoreItem[]
  },

  sexshop: {
    id: "sexshop",
    name: "Sex Shop",
    managerId: "Sexshop1212",
    items: [
      // Fumos e Poções Exóticos
      {
        id: "tabaco_pau_fogo",
        name: "Tabaco do Pau de Fogo",
        price: 120,
        description: "Tabaco exótico estimulante",
        category: "Fumos e Poções Exóticos",
        effect: { type: "mood", value: 20, duration: 15, message: "Fumegando com paixão" }
      },
      {
        id: "po_pinica",
        name: "Pó do Pinica-Pinica",
        price: 65,
        description: "Pó mágico estimulante",
        category: "Fumos e Poções Exóticos",
        effect: { type: "mood", value: 15, duration: 10, message: "Formigando de prazer" }
      },
      {
        id: "essencia_dragao",
        name: "Essência de Dragão",
        price: 90,
        description: "Essência poderosa estimulante",
        category: "Fumos e Poções Exóticos",
        effect: { type: "mood", value: 18, duration: 12, message: "Poder do dragão despertado" }
      },
      // Preservativos e Lubrificantes Mágicos
      {
        id: "camisinha_floco",
        name: "Camisinha do Floco de Neve",
        price: 90,
        description: "Pacote com 3 unidades geladas",
        category: "Preservativos e Lubrificantes Mágicos"
      },
      {
        id: "camisinha_apertou",
        name: "Camisinha do Apertou, Virou",
        price: 50,
        description: "Para momentos especiais",
        category: "Preservativos e Lubrificantes Mágicos"
      },
      {
        id: "lubrificante_mel",
        name: "Lubrificante de Mel",
        price: 80,
        description: "Lubrificante doce e mágico",
        category: "Preservativos e Lubrificantes Mágicos"
      },
      {
        id: "camisinha_sem_escapatoria",
        name: "Camisinha do Sem Escapatória",
        price: 150,
        description: "Proteção máxima garantida",
        category: "Preservativos e Lubrificantes Mágicos"
      },
      // Próteses e Vibradores Mágicos
      {
        id: "penis_dragao",
        name: "Pênis de Dragão",
        price: 300,
        description: "Prótese mágica poderosa",
        category: "Próteses e Vibradores Mágicos"
      },
      {
        id: "vibrador_sereia",
        name: "Vibrador do Canto da Sereia",
        price: 200,
        description: "Vibrador encantado",
        category: "Próteses e Vibradores Mágicos"
      },
      {
        id: "algemas_presa",
        name: "Algemas do Presa Voluntária",
        price: 180,
        description: "Algemas mágicas especiais",
        category: "Próteses e Vibradores Mágicos"
      },
      {
        id: "plug_formigas",
        name: "Plug anal das Formigas de Fogo",
        price: 60,
        description: "Sensação formigante especial",
        category: "Próteses e Vibradores Mágicos"
      },
      {
        id: "penis_tempestade",
        name: "Pênis Tempestade",
        price: 150,
        description: "Prótese com poder da tempestade",
        category: "Próteses e Vibradores Mágicos"
      },
      {
        id: "egg_cobras",
        name: "Egg das Cobras Mágicas",
        price: 50,
        description: "Kit com 3 tipos diferentes",
        category: "Próteses e Vibradores Mágicos"
      },
      // Lingeries e Fantasias Eróticas
      {
        id: "sutia_midas",
        name: "Sutiã do Toque de Midas",
        price: 250,
        description: "Lingerie dourada especial",
        category: "Lingeries e Fantasias Eróticas"
      },
      {
        id: "fantasia_sacerdotisa",
        name: "Fantasia de Sacerdotisa das Sombras",
        price: 400,
        description: "Fantasia erótica mística",
        category: "Lingeries e Fantasias Eróticas"
      },
      {
        id: "calcinha_desafio",
        name: "Calcinha do Desafio",
        price: 130,
        description: "Lingerie provocante especial",
        category: "Lingeries e Fantasias Eróticas"
      },
      // Géis e Cremes dos Deuses
      {
        id: "gel_sopro_gelado",
        name: "Gel do Sopro Gelado",
        price: 70,
        description: "Gel refrescante mágico",
        category: "Géis e Cremes dos Deuses"
      },
      {
        id: "creme_crescimento",
        name: "Creme de Crescimento Instantâneo",
        price: 160,
        description: "Creme com poderes especiais",
        category: "Géis e Cremes dos Deuses"
      },
      // Acessórios BDSM e Fetiches
      {
        id: "chicote_feiticeiro",
        name: "Chicote do Aprendiz de Feiticeiro",
        price: 220,
        description: "Chicote mágico especial",
        category: "Acessórios BDSM e Fetiches"
      },
      {
        id: "coleira_animal",
        name: "Coleira do Animal Interior",
        price: 190,
        description: "Coleira que desperta instintos",
        category: "Acessórios BDSM e Fetiches"
      },
      {
        id: "vela_prazer",
        name: "Vela do Prazer e Dor",
        price: 110,
        description: "Vela sensorial mágica",
        category: "Acessórios BDSM e Fetiches"
      },
      // Cosméticos Mágicos
      {
        id: "batom_hipnotico",
        name: "Batom do Beijo Hipnótico",
        price: 95,
        description: "Batom com poderes de sedução",
        category: "Cosméticos Mágicos",
        effect: { type: "mood", value: 25, duration: 30, message: "Lábios hipnoticamente irresistíveis" }
      },
      {
        id: "perfume_ciume",
        name: "Perfume do Ciúme Incontrolável",
        price: 140,
        description: "Perfume que desperta ciúmes",
        category: "Cosméticos Mágicos",
        effect: { type: "mood", value: 20, duration: 25, message: "Aura de ciúme irresistível" }
      },
      {
        id: "sombra_predador",
        name: "Sombra dos Olhos de Predador",
        price: 120,
        description: "Sombra que intensifica o olhar",
        category: "Cosméticos Mágicos",
        effect: { type: "mood", value: 22, duration: 20, message: "Olhar predatório hipnotizante" }
      },
      // Pacotes Promocionais
      {
        id: "kit_dominacao",
        name: "Kit Dominação Dragônica",
        price: 600,
        description: "Kit completo de dominação",
        category: "Pacotes Promocionais"
      },
      {
        id: "kit_ilusoes",
        name: "Kit Noite das Ilusões",
        price: 450,
        description: "Kit para noites especiais",
        category: "Pacotes Promocionais"
      },
      {
        id: "kit_safadeza",
        name: "Kit Safadeza Básica",
        price: 300,
        description: "Kit iniciante completo",
        category: "Pacotes Promocionais"
      },
      // Anéis de Amizade removido
      // Pulseiras de Amizade
      {
        id: "pulseira_laco_amizade",
        name: "Laço de amizade → Pulseirinha da Parceria",
        price: 180,
        description: "Pulseira que conecta almas de verdadeiros parceiros",
        category: "Pulseiras (amizade)",
        relationshipType: "friendship",
        icon: "🤝",
        itemType: "object"
      },
      // Colares de Amizade removido
      // Relógios de Amizade
      {
        id: "relogio_lacos_eternos",
        name: "Laços Eternos → Tic-Tac da Brotheragem",
        price: 350,
        description: "Relógio que marca o tempo de uma amizade sem fim",
        category: "Relógios (amizade)",
        relationshipType: "friendship",
        icon: "⏰",
        itemType: "object"
      }
    ] as StoreItem[]
  },

  cafeteria: {
    id: "cafeteria", 
    name: "Cafeteria",
    managerId: "Cafeteria1212",
    items: [
      // Bebidas Quentes Mágicas
      {
        id: "latte_nuvens_doces",
        name: "Latte das Nuvens Doces",
        price: 40,
        description: "Leveza das nuvens em cada gole",
        category: "Bebidas Quentes Mágicas",
        effect: { type: "energy", value: 20, duration: 15, message: "Um gole e você sente a leveza das nuvens adoçando sua alma." }
      },
      {
        id: "cha_serenidade_bosque",
        name: "Chá da Serenidade do Bosque",
        price: 35,
        description: "Calma dos ventos que percorrem as clareiras",
        category: "Bebidas Quentes Mágicas",
        effect: { type: "energy", value: 18, duration: 20, message: "Cada xícara traz a calma dos ventos suaves que percorrem as clareiras mágicas." }
      },
      {
        id: "cappuccino_fogo_manso",
        name: "Cappuccino de Fogo Manso",
        price: 45,
        description: "Calor suave que envolve o coração",
        category: "Bebidas Quentes Mágicas",
        effect: { type: "energy", value: 23, duration: 10, message: "O calor suave deste café envolve seu coração sem jamais queimar." }
      },
      {
        id: "chocolate_quente_ternura",
        name: "Chocolate Quente da Ternura",
        price: 38,
        description: "Doce abraço em forma de bebida",
        category: "Bebidas Quentes Mágicas",
        effect: { type: "energy", value: 19, duration: 25, message: "Doce abraço em forma de bebida, feito para aquecer memórias." }
      },
      {
        id: "cha_azul_estrelas",
        name: "Chá Azul das Estrelas",
        price: 50,
        description: "O brilho da noite em cada gole",
        category: "Bebidas Quentes Mágicas",
        effect: { type: "energy", value: 25, duration: 30, message: "O brilho da noite em cada gole, iluminando sua mente para aprender." }
      },

      // Doces Mágicos
      {
        id: "bolo_arco_iris_celestial",
        name: "Bolo de Arco-Íris Celestial",
        price: 30,
        description: "Cada fatia é um pedaço do céu",
        category: "Doces Mágicos",
        effect: { type: "hunger", value: 25, duration: 20, message: "Cada fatia é um pedaço do céu dançando no prato." }
      },
      {
        id: "macaron_luz_sombras",
        name: "Macaron de Luz e Sombras",
        price: 18,
        description: "Equilíbrio perfeito entre claro e escuro",
        category: "Doces Mágicos",
        effect: { type: "hunger", value: 15, duration: 15, message: "Equilíbrio perfeito entre o claro e o escuro, para quem busca harmonia." }
      },
      {
        id: "croissant_vento_leve",
        name: "Croissant do Vento Leve",
        price: 25,
        description: "Macio como uma brisa da manhã",
        category: "Doces Mágicos",
        effect: { type: "hunger", value: 15, duration: 10, message: "Macio como uma brisa da manhã que se desfaz no toque." }
      },
      {
        id: "biscoitos_baunilha_lunar",
        name: "Biscoitos de Baunilha Lunar",
        price: 20,
        description: "Pequenos encantos assados sob o luar",
        category: "Doces Mágicos",
        effect: { type: "hunger", value: 15, duration: 25, message: "Pequenos encantos assados sob o luar, espalhando ternura no ar." }
      },

      // Bebidas Frias Mágicas
      {
        id: "smoothie_elemental_fogo",
        name: "Smoothie Elemental - Fogo",
        price: 42,
        description: "Elemento fogo que aumenta coragem",
        category: "Bebidas Frias Mágicas",
        effect: { type: "energy", value: 21, duration: 15, message: "Escolha seu elemento e deixe a energia fluir em cada gole. (Fogo: Aumenta coragem)" }
      },
      {
        id: "smoothie_elemental_agua",
        name: "Smoothie Elemental - Água",
        price: 42,
        description: "Elemento água que refresca a mente",
        category: "Bebidas Frias Mágicas",
        effect: { type: "energy", value: 21, duration: 20, message: "Escolha seu elemento e deixe a energia fluir em cada gole. (Água: Refresca a mente)" }
      },
      {
        id: "smoothie_elemental_terra",
        name: "Smoothie Elemental - Terra",
        price: 42,
        description: "Elemento terra que dá saciedade",
        category: "Bebidas Frias Mágicas",
        effect: { type: "energy", value: 21, duration: 25, message: "Escolha seu elemento e deixe a energia fluir em cada gole. (Terra: Dá sensação de saciedade)" }
      },
      {
        id: "smoothie_elemental_ar",
        name: "Smoothie Elemental - Ar",
        price: 42,
        description: "Elemento ar que traz leveza",
        category: "Bebidas Frias Mágicas",
        effect: { type: "energy", value: 21, duration: 15, message: "Escolha seu elemento e deixe a energia fluir em cada gole. (Ar: Leveza e bom humor)" }
      },
      {
        id: "soda_brilhante_aurora",
        name: "Soda Brilhante da Aurora",
        price: 33,
        description: "Um arco-íris efervescente no copo",
        category: "Bebidas Frias Mágicas",
        effect: { type: "energy", value: 17, duration: 15, message: "Um arco-íris efervescente dentro do seu copo." }
      },
      {
        id: "leite_gelido_dragao_azul",
        name: "Leite Gélido do Dragão Azul",
        price: 37,
        description: "Frescor do dragão envolvendo o coração",
        category: "Bebidas Frias Mágicas",
        effect: { type: "energy", value: 19, duration: 20, message: "Um gole e o frescor do dragão envolve seu coração." }
      },

      // Comidinhas Leves
      {
        id: "torrada_sol_poente",
        name: "Torrada do Sol Poente",
        price: 28,
        description: "Sabores que mudam como o pôr-do-sol",
        category: "Comidinhas Leves",
        effect: { type: "hunger", value: 15, duration: 15, message: "Sabores que mudam como o pôr-do-sol em cada mordida." }
      },
      {
        id: "panqueca_sonhos_doces",
        name: "Panqueca dos Sonhos Doces",
        price: 32,
        description: "Pequenos encantos que fazem a manhã brilhar",
        category: "Comidinhas Leves",
        effect: { type: "hunger", value: 20, duration: 20, message: "Pequenos encantos que fazem a manhã brilhar." }
      },
      {
        id: "ramen_consolo_magico",
        name: "Ramen do Consolo Mágico (Mini)",
        price: 50,
        description: "Calor que aquece estômago e coração",
        category: "Comidinhas Leves",
        effect: { type: "hunger", value: 25, duration: 25, message: "Um calor que aquece não só o estômago, mas também o coração." }
      },

      // Combo Especial
      {
        id: "combo_encantado_dia",
        name: "Combo Encantado do Dia",
        price: 70,
        description: "Experiência completa de sabor e magia",
        category: "Combo Especial",
        effect: { type: "hunger", value: 30, duration: 30, message: "Uma experiência completa de sabor e magia, com uma surpresa especial." }
      },

      // Comidas
      {
        id: "vento_doce_montanhas",
        name: "Vento doce das montanhas",
        price: 35,
        description: "Um doce leve e açucarado que dá sensação de frescor.",
        category: "Comidas",
        effect: { type: "hunger", value: 15, duration: 20, message: "Sabor de brisa fresca… como caminhar por campos ao amanhecer." }
      },
      {
        id: "torta_galaxia_sonhos",
        name: "Torta galáxia dos sonhos",
        price: 50,
        description: "Uma torta colorida que brilha no escuro.",
        category: "Comidas",
        effect: { type: "hunger", value: 25, duration: 25, message: "Sabor de estrelas… como um abraço do universo durante a noite." }
      },
      {
        id: "encanto_lua_azul",
        name: "Encanto da Lua Azul",
        price: 70,
        description: "Uma sobremesa rara que muda de cor sob a luz.",
        category: "Comidas",
        effect: { type: "hunger", value: 20, duration: 30, message: "Sabor de serenidade… como sentar sob a lua e ouvir o silêncio." }
      },
      {
        id: "encanto_solar",
        name: "Encanto Solar",
        price: 65,
        description: "Uma torta dourada que parece feita de raios de sol.",
        category: "Comidas",
        effect: { type: "hunger", value: 30, duration: 25, message: "Sabor de calor… como receber o abraço de um dia ensolarado." }
      },
      {
        id: "sopro_geada",
        name: "Sopro da Geada",
        price: 40,
        description: "Um sorvete gelado que solta vapor frio.",
        category: "Comidas",
        effect: { type: "hunger", value: 20, duration: 20, message: "Sabor de gelo… como mergulhar em um lago cristalino ao amanhecer." }
      },

      // Bebidas
      {
        id: "esfinge",
        name: "Esfinge",
        price: 120,
        description: "Um licor raro que some no ar ao beber.",
        category: "Bebidas",
        effect: { type: "hunger", value: 5, duration: 15, message: "Sabor de mistério… como caminhar sem ser visto pelos outros." }
      },
      {
        id: "oceanix",
        name: "Oceanix",
        price: 90,
        description: "Bebida azul que emite sons suaves como canções de sereias.",
        category: "Bebidas",
        effect: { type: "hunger", value: 10, duration: 20, message: "Sabor de mar… como ouvir as canções das ondas e sentir paz profunda." }
      }
    ] as StoreItem[]
  }
};