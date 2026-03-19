export interface MindMapNode {
  name: string;
  page?: number;
  children?: MindMapNode[];
}

export const STATIC_MIND_MAP: MindMapNode = {
  name: "Terapia Ocupacional: Atividades, Domínio e Processo",
  children: [
    {
      name: "Método Terapia Ocupacional Dinâmica (MTOD)",
      children: [
        { name: "Conceitos Fundamentais", page: 5 },
        { name: "Tríade Terapêutica", page: 8 },
        { name: "Processo de Intervenção", page: 12 },
        { name: "Raciocínio Clínico no MTOD", page: 15 }
      ]
    },
    {
      name: "Estrutura da Prática (AOTA/EPTO 4ª Ed.)",
      children: [
        {
          name: "Domínio",
          children: [
            { name: "Ocupações", page: 20 },
            { name: "Contextos", page: 25 },
            { name: "Padrões de Desempenho", page: 30 },
            { name: "Competências de Desempenho", page: 35 },
            { name: "Fatores do Cliente", page: 40 }
          ]
        },
        {
          name: "Processo",
          children: [
            { name: "Avaliação", page: 45 },
            { name: "Intervenção", page: 50 },
            { name: "Resultados", page: 55 }
          ]
        }
      ]
    }
  ]
};
