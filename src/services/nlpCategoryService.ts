export interface SuggestionResult {
  categoryId: string;
  categoryName: string;
  confidence: number;
  reason: string;
}

interface KeywordRule {
  categoryId: string;
  categoryName: string;
  keywords: string[];
  explanation: string;
}

const CATEGORY_RULES: KeywordRule[] = [
  {
    categoryId: 'canalizacao',
    categoryName: 'Canalização',
    keywords: [
      'torneira', 'vazando', 'vazar', 'vazamento', 'fuga', 'fuga de agua', 'água', 'agua',
      'cano', 'tubo', 'esgoto', 'entupido', 'desentupir', 'sanita', 'autoclismo', 'lavatório',
      'pia', 'bomba de agua', 'bomba d água', 'tanque', 'cisterna', 'infiltração', 'infiltracao'
    ],
    explanation: 'Problema relacionado a tubagens, água ou esgoto.',
  },
  {
    categoryId: 'eletricidade',
    categoryName: 'Eletricidade',
    keywords: [
      'tomada', 'interruptor', 'fio', 'fiação', 'curto', 'curto-circuito', 'curto circuito',
      'disjuntor', 'quadro eletrico', 'quadro', 'eletrico', 'elétrico', 'luz', 'lampada',
      'lâmpada', 'candeeiro', 'choque', 'gerador', 'painel solar', 'inversor', 'estabilizador'
    ],
    explanation: 'Problema elétrico ou instalação de energia.',
  },
  {
    categoryId: 'telemoveis',
    categoryName: 'Telemóveis',
    keywords: [
      'telefone', 'telemóvel', 'telemovel', 'celular', 'ecrã', 'ecra', 'tela', 'display',
      'bateria', 'carregador', 'conector', 'não liga', 'nao liga', 'iphone', 'samsung',
      'vidro partido', 'partido', 'desbloqueio', 'placa', 'audio', 'som'
    ],
    explanation: 'Reparação de hardware ou software em smartphone/telemóvel.',
  },
  {
    categoryId: 'informatica',
    categoryName: 'Informática',
    keywords: [
      'computador', 'portátil', 'portatil', 'laptop', 'pc', 'lento', 'vírus', 'virus',
      'formatar', 'windows', 'macbook', 'disco', 'ssd', 'memória', 'memoria', 'ecrã azul',
      'ecra azul', 'internet', 'wi-fi', 'wifi', 'rede', 'impressora'
    ],
    explanation: 'Manutenção de computadores, impressoras ou redes de computadores.',
  },
  {
    categoryId: 'limpeza',
    categoryName: 'Limpeza',
    keywords: [
      'lavar', 'limpar', 'limpeza', 'faxina', 'faxineira', 'casa', 'vivenda', 'apartamento',
      'escritório', 'escritorio', 'sofá', 'sofa', 'tapete', 'colchão', 'colchao', 'vidros',
      'pós-obra', 'pos obra', 'engomar', 'roupa'
    ],
    explanation: 'Serviço de limpeza residencial, comercial ou higienização.',
  },
  {
    categoryId: 'mecanica',
    categoryName: 'Mecânica',
    keywords: [
      'carro', 'automóvel', 'automovel', 'viatura', 'motor', 'avariou', 'avaria', 'travão',
      'travao', 'freio', 'óleo', 'oleo', 'pneu', 'radiador', 'bateria de carro', 'embreagem',
      'suspensão', 'suspensao', 'revisão', 'revisao', 'guincho'
    ],
    explanation: 'Manutenção mecânica ou emergência automotiva.',
  },
  {
    categoryId: 'climatizacao',
    categoryName: 'Climatização',
    keywords: [
      'ar condicionado', 'ac', 'split', 'não gela', 'nao gela', 'não arrefece', 'nao arrefece',
      'gás', 'gas', 'pingando', 'ventilador', 'limpeza de split', 'refrigeração', 'refrigeracao'
    ],
    explanation: 'Instalação, reparação ou carga de gás em ar condicionado.',
  },
  {
    categoryId: 'pintura',
    categoryName: 'Pintura',
    keywords: [
      'pintar', 'pintura', 'tinta', 'parede', 'fachada', 'massa corrida', 'fissura', 'verniz',
      'portão', 'portao', 'grade'
    ],
    explanation: 'Serviço de pintura predial, residencial ou acabamento.',
  }
];

export function detectCategoryFromText(text: string): SuggestionResult | null {
  if (!text || text.trim().length < 3) return null;
  const lower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  let bestMatch: SuggestionResult | null = null;
  let highestScore = 0;

  for (const rule of CATEGORY_RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      const normalizedKw = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (lower.includes(normalizedKw)) {
        // Longer matching words give higher weight
        score += normalizedKw.length >= 6 ? 3 : 2;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = {
        categoryId: rule.categoryId,
        categoryName: rule.categoryName,
        confidence: Math.min(100, Math.round((score / 6) * 100)),
        reason: rule.explanation,
      };
    }
  }

  return highestScore > 0 ? bestMatch : null;
}
