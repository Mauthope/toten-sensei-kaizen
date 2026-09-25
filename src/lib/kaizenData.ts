import { KaizenPill, QuizQuestion } from '../types';

export const IDLE_PHRASES = [
  "Cadê todo mundo? O Sensei está procurando talentos Kaizen...",
  "Varrendo o ambiente com meu super binóculo... 🔭",
  "Alguém aí pronto para eliminar desperdícios hoje?",
  "Detectando oportunidades de melhoria contínua...",
  "Psiu! Aproxime-se do toten, não mordo!",
  "Procurando campeões da produtividade...",
  "Um pequeno passo hoje, um grande salto amanhã! Chega mais!",
  "Atenção: Meus sensores indicam ausência de humanos no raio de visão."
];

export const GREETING_PHRASES = [
  "Olá! Estou te vendo! 👀 Você sabe o que é Kaizen?",
  "Aha! Te avistei! Que bom que você veio até aqui!",
  "Parado aí, campeão! O Sensei te viu com o binóculo!",
  "Opa! Bem-vindo! Sabia que hoje é um ótimo dia para melhorar 1%?",
  "Te vi! Venha cá aprender uma pílula rápida de Kaizen!"
];

export const KAIZEN_PILLS: KaizenPill[] = [
  {
    id: 'o-que-e-kaizen',
    title: 'O que é Kaizen? (改善)',
    subtitle: 'Mudança para melhor • Melhoria Contínua',
    tag: 'Filosofia Base',
    color: 'cyan',
    content: 'Kaizen é uma palavra japonesa composta por Kai (mudança) e Zen (bom ou melhor). Significa melhorar continuamente todos os dias, todos os colaboradores, em todas as áreas.',
    tip: '💡 Pequenas melhorias diárias somam resultados gigantescos ao final de um ano!'
  },
  {
    id: 'os-5s',
    title: 'O Poder do 5S',
    subtitle: 'Organização, Limpeza e Disciplina',
    tag: 'Metodologia',
    color: 'emerald',
    content: '1. Seiri (Utilização) • 2. Seiton (Organização) • 3. Seiso (Limpeza) • 4. Seiketsu (Padronização) • 5. Shitsuke (Autodisciplina).',
    tip: '💡 Um ambiente organizado reduz acidentes, economiza tempo e melhora o ânimo!'
  },
  {
    id: '8-desperdicios',
    title: 'Os 8 Desperdícios (Muda)',
    subtitle: 'Identificar para eliminar',
    tag: 'Lean Manufacturing',
    color: 'amber',
    content: '1. Superprodução • 2. Espera • 3. Transporte desnecessário • 4. Excesso de processamento • 5. Inventário/Estoque • 6. Movimentação inútil • 7. Defeitos/Retrabalho • 8. Potencial intelectual subutilizado.',
    tip: '💡 Olhe ao seu redor: onde você vê tempo ou material sendo desperdiçado agora?'
  },
  {
    id: 'gemba',
    title: 'Vá ao Gemba! (現場)',
    subtitle: 'Onde o trabalho real acontece',
    tag: 'Liderança Ativa',
    color: 'blue',
    content: 'Gemba significa "o lugar real". Não decida as coisas trancado numa sala de reuniões. Vá até o posto de trabalho, converse com quem executa e veja a realidade com os próprios olhos.',
    tip: '💡 Os melhores insights vêm de quem está com a mão na massa!'
  },
  {
    id: 'poka-yoke',
    title: 'Poka-Yoke: À Prova de Erros',
    subtitle: 'Design inteligente no posto de trabalho',
    tag: 'Qualidade Total',
    color: 'purple',
    content: 'Mecanismos que impedem fisicamente que um erro humano aconteça. Exemplo do dia a dia: o cabo USB ou conector que só entra na posição correta.',
    tip: '💡 Em vez de culpar as pessoas pelo erro, crie processos que tornem o erro impossível!'
  }
];

export const INITIAL_QUIZ: QuizQuestion = {
  id: 'kaizen-intro',
  question: 'Você sabe o que é Kaizen?',
  options: [
    {
      text: 'Sim, sei muito bem! 🚀',
      correct: true,
      response: 'Sensacional! Parabéns pelo espírito de melhoria contínua! Vamos ao desafio do dia?'
    },
    {
      text: 'Mais ou menos... me ensina! 🤔',
      correct: true,
      response: 'Com prazer! Kaizen é a arte de melhorar 1% todos os dias sem parar!'
    },
    {
      text: 'Nunca ouvi falar! 🤷',
      correct: true,
      response: 'Que sorte você ter passado aqui! Kaizen vai mudar o jeito que você enxerga seu dia a dia!'
    }
  ]
};
