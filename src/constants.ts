export type OccupationCategory = 
  | 'ADLs' 
  | 'IADLs' 
  | 'Health Management' 
  | 'Rest and Sleep' 
  | 'Education' 
  | 'Work' 
  | 'Play' 
  | 'Leisure' 
  | 'Social Participation';

export interface OTPFSection {
  title: string;
  description: string;
  items: string[];
}

export const DOMAIN_SECTIONS: OTPFSection[] = [
  {
    title: 'Ocupações',
    description: 'Atividades cotidianas personalizadas que as pessoas realizam individualmente, em famílias e com comunidades para ocupar o tempo e trazer significado e propósito à vida.',
    items: ['AVDs', 'AIVDs', 'Gestão da Saúde', 'Descanso e Sono', 'Educação', 'Trabalho', 'Brincar', 'Lazer', 'Participação Social']
  },
  {
    title: 'Contextos',
    description: 'Fatores ambientais e pessoais específicos de cada cliente que influenciam o engajamento e a participação em ocupações.',
    items: ['Fatores Ambientais', 'Fatores Pessoais']
  },
  {
    title: 'Padrões de Desempenho',
    description: 'Hábitos, rotinas, papéis e rituais usados no processo de engajamento em ocupações ou atividades.',
    items: ['Hábitos', 'Rotinas', 'Papéis', 'Rituais']
  },
  {
    title: 'Competências de Desempenho',
    description: 'Ações observáveis e direcionadas a objetivos que resultam na qualidade do desempenho do cliente em ocupações desejadas.',
    items: ['Habilidades Motoras', 'Habilidades de Processo', 'Habilidades de Interação Social']
  },
  {
    title: 'Fatores do Cliente',
    description: 'Capacidades, características ou crenças específicas que residem na pessoa e que influenciam o desempenho em ocupações.',
    items: ['Valores, Crenças e Espiritualidade', 'Funções do Corpo', 'Estruturas do Corpo']
  }
];

export const PROCESS_SECTIONS: OTPFSection[] = [
  {
    title: 'Avaliação',
    description: 'Focada em descobrir o que o cliente quer e precisa fazer; determinar o que o cliente pode fazer e tem feito; e identificar suportes e barreiras à saúde, bem-estar e participação.',
    items: ['Perfil Ocupacional', 'Análise do Desempenho Ocupacional', 'Síntese do Processo de Avaliação']
  },
  {
    title: 'Intervenção',
    description: 'Consiste em serviços prestados por profissionais de terapia ocupacional em colaboração com os clientes para facilitar o engajamento na ocupação relacionada à saúde, bem-estar e participação.',
    items: ['Plano de Intervenção', 'Implementação da Intervenção', 'Revisão da Intervenção']
  },
  {
    title: 'Resultados',
    description: 'O resultado final do processo de terapia ocupacional; descrevem o que os clientes podem alcançar por meio da intervenção da terapia ocupacional.',
    items: ['Desempenho Ocupacional', 'Prevenção', 'Saúde e Bem-estar', 'Qualidade de Vida', 'Participação', 'Competência de Papel', 'Bem-estar', 'Justiça Ocupacional']
  }
];
