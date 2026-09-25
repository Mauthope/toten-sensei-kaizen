import { KaizenPill } from '../types';

export interface DynamicHookOption {
  text: string;
  reactionSpeech: string;
  methodologyIntro: string;
  recommendedPillId: string;
}

export interface DynamicHook {
  id: string;
  calloutSpeech: string;
  title: string;
  badge: string;
  question: string;
  options: DynamicHookOption[];
}

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

export const DYNAMIC_HOOKS: DynamicHook[] = [
  {
    id: 'ferramenta-sumida',
    calloutSpeech: 'Psiu! Ei, você aí! Pare dez segundos, o Sensei precisa te fazer uma pergunta rápida!',
    title: 'O Mistério da Ferramenta Sumida',
    badge: 'Produtividade no Turno',
    question: 'No seu dia a dia na fábrica, o que mais te faz perder tempo e paciência?',
    options: [
      {
        text: 'Procurar ferramentas sumidas! 🔍',
        reactionSpeech: 'É exatamente por isso que o 5S foi criado! Se cada ferramenta tiver seu lugar certo, você nunca mais perde tempo caçando nada!',
        methodologyIntro: 'No Japão, a metodologia 5S nasceu na Toyota justamente para acabar com o tempo perdido procurando materiais. Cada minuto caçando uma chave é cansaço inútil!',
        recommendedPillId: 'os-5s'
      },
      {
        text: 'Esperar material ou ordens atrasadas! ⏳',
        reactionSpeech: 'Isso no Kaizen se chama Desperdício de Espera! É um dos oito grandes ladrões de produtividade da indústria!',
        methodologyIntro: 'No Lean Manufacturing, o tempo de espera parado é chamado de "Muda de Espera". O Kaizen ensina a sincronizar os processos para que tudo flua sem gargalos.',
        recommendedPillId: '8-desperdicios'
      },
      {
        text: 'Ter que refazer peça que deu defeito! 💥',
        reactionSpeech: 'Retrabalho é cansativo e frustrante! O Kaizen ensina a criar travas à prova de erros para que o defeito nunca mais aconteça!',
        methodologyIntro: 'Para eliminar retrabalho, o Kaizen utiliza o "Poka-Yoke": dispositivos inteligentes que impedem fisicamente que o erro humano ocorra.',
        recommendedPillId: 'poka-yoke'
      },
      {
        text: 'Ficar andando pra lá e pra cá à toa! 🏃',
        reactionSpeech: 'Desperdício de movimentação inútil! Reorganizando o posto de trabalho, você cansa menos o corpo e produz muito mais!',
        methodologyIntro: 'O desperdício de movimentação cansa as pernas e a coluna sem gerar nenhum valor real. O Kaizen aproxima as ferramentas da mão do operador.',
        recommendedPillId: '8-desperdicios'
      }
    ]
  },
  {
    id: 'teste-surpresa',
    calloutSpeech: 'Alto lá, companheiro! O Sensei te flagrou no radar! Me responda com sinceridade:',
    title: 'O Teste da Bancada',
    badge: 'Organização 5S',
    question: 'Se a diretoria ou o cliente fizesse uma auditoria surpresa no seu posto agora, como estaria?',
    options: [
      {
        text: 'Brilhando e 100% no padrão! 🏆',
        reactionSpeech: 'Sensacional, parabéns! Você já tem o espírito Shitsuke de autodisciplina do 5S! Que tal um desafio prático?',
        methodologyIntro: 'Manter o posto impecável mesmo na correria é o 5º senso do 5S: Shitsuke (Autodisciplina). Você é um exemplo de Melhoria Contínua!',
        recommendedPillId: 'os-5s'
      },
      {
        text: 'Tem coisa fora do lugar, mas eu me acho! 😅',
        reactionSpeech: 'Cuidado com o "eu me acho"! A regra de ouro do Kaizen é: qualquer colega deve achar qualquer item no seu posto em até 30 segundos!',
        methodologyIntro: 'O Kaizen prega a gestão visual: se você precisar se ausentar, o colega do próximo turno precisa encontrar tudo sem estresse e sem atrasos.',
        recommendedPillId: 'os-5s'
      },
      {
        text: 'Melhor nem olharem muito de perto... 🙈',
        reactionSpeech: 'Sem pânico! O primeiro passo do Kaizen é o Seiri: separar o que é útil do que é lixo e liberar espaço na bancada!',
        methodologyIntro: 'Acúmulo de coisas inúteis gera confusão mental e riscos de segurança. Aplicando o Seiri (Descarte Consciente), seu trabalho fica duas vezes mais leve.',
        recommendedPillId: 'os-5s'
      },
      {
        text: 'Depende da correria do dia! 🌪️',
        reactionSpeech: 'A pressa não pode atropelar a segurança e o padrão! O Kaizen ensina a padronizar para não virar bagunça nos picos de produção!',
        methodologyIntro: 'Quando há padronização (Seiketsu), a velocidade da fábrica aumenta naturalmente, sem necessidade de correria desorganizada.',
        recommendedPillId: 'o-que-e-kaizen'
      }
    ]
  },
  {
    id: 'trabalho-inteligente',
    calloutSpeech: 'Aha! Não passe direto não! Meus sensores detectaram um colaborador dedicado por aqui!',
    title: 'Inteligência vs. Força Bruta',
    badge: 'Filosofia Kaizen',
    question: 'Você prefere fazer esforço dobrado ou encontrar um jeito mais esperto e leve de produzir?',
    options: [
      {
        text: 'Trabalhar com inteligência sempre! 🧠',
        reactionSpeech: 'Falou a língua do Sensei! Kaizen é exatamente isso: usar a cabeça para poupar o corpo e eliminar trabalho braçal inútil!',
        methodologyIntro: 'Kaizen vem do japonês "Kai" (mudar) + "Zen" (bom). Significa melhorar 1% todo dia para trabalhar com leveza e precisão máxima.',
        recommendedPillId: 'o-que-e-kaizen'
      },
      {
        text: 'Às vezes sinto que me esforço à toa... 😓',
        reactionSpeech: 'Eu te entendo perfeitamente! Quando o método de trabalho é ruim, o esforço vai pro ralo. O Kaizen serve para consertar o processo!',
        methodologyIntro: 'No Lean, nunca culpamos o operador: consertamos o processo! Se o trabalho está pesado demais, há uma oportunidade de melhoria no Gemba.',
        recommendedPillId: 'gemba'
      },
      {
        text: 'Quero terminar o turno sem dor nas costas! 💆',
        reactionSpeech: 'Ergonomia e 5S andam de mãos dadas! Pequenas melhorias na altura da bancada e no apoio de peças mudam a sua saúde!',
        methodologyIntro: 'A Melhoria Contínua cuida em primeiro lugar da saúde do trabalhador. Um posto ergonômico evita lesões e cansaço excessivo.',
        recommendedPillId: 'os-5s'
      },
      {
        text: 'Me mostra como fazer mais com menos cansaço! ⚡',
        reactionSpeech: 'Vem com o Sensei! O segredo é eliminar os desperdícios que estão escondidos debaixo do nosso nariz!',
        methodologyIntro: 'Ao cortar os 8 desperdícios clássicos da manufatura, a produção flui com naturalidade, sem correria e sem sobrecarga física.',
        recommendedPillId: '8-desperdicios'
      }
    ]
  },
  {
    id: 'banco-de-ideias',
    calloutSpeech: 'Opa, chefia! Chega mais perto da tela! Você tem cara de quem tem boas ideias na manga!',
    title: 'A Voz de Quem Opera',
    badge: 'Cultura Gemba',
    question: 'Você já teve alguma ideia simples no trabalho que facilitaria a vida de todo mundo?',
    options: [
      {
        text: 'Já tive várias ideias excelentes! 💡',
        reactionSpeech: 'É você quem a fábrica precisa ouvir! O Kaizen prega o Gemba: as soluções mais geniais vêm de quem tá com a mão na massa!',
        methodologyIntro: 'No Japão, os diretores vão ao "Gemba" (o chão da fábrica) porque sabem que quem opera a máquina entende do problema melhor do que qualquer um.',
        recommendedPillId: 'gemba'
      },
      {
        text: 'Tenho uma ideia agora mesmo! 🚀',
        reactionSpeech: 'Não guarde essa ideia com você! Vamos registrá-la no nosso banco de melhorias agora mesmo!',
        methodologyIntro: 'Uma única sugestão simples de um colaborador pode economizar milhares de reais e evitar acidentes graves na empresa.',
        recommendedPillId: 'gemba'
      },
      {
        text: 'Nunca me perguntaram isso... 🤔',
        reactionSpeech: 'Pois o Sensei está perguntando! No Kaizen, toda voz tem valor, do estagiário à presidência!',
        methodologyIntro: 'Cultura Kaizen é democrática e participativa. Pequenas melhorias diárias dadas por todos constroem uma empresa de classe mundial.',
        recommendedPillId: 'o-que-e-kaizen'
      },
      {
        text: 'Acho que as coisas estão boas assim! 👍',
        reactionSpeech: 'Cuidado com a zona de conforto! No Kaizen, o lema é claro: hoje melhor que ontem, amanhã melhor que hoje!',
        methodologyIntro: 'Mesmo o melhor processo do mundo pode melhorar 1% amanhã. Essa é a essência da Melhoria Contínua.',
        recommendedPillId: 'o-que-e-kaizen'
      }
    ]
  },
  {
    id: 'desafio-rapido',
    calloutSpeech: 'Ei, você aí de uniforme! Piscou, perdeu! Pare aqui que o Sensei tem um desafio pro seu turno!',
    title: 'O Desafio do Turno',
    badge: 'Ação Prática',
    question: 'Topa uma missão rápida de 2 minutos para deixar seu setor mais seguro e produtivo hoje?',
    options: [
      {
        text: 'Topo na hora! Manda ver! 🎯',
        reactionSpeech: 'Esse é o espírito guerreiro Kaizen! Vamos praticar a autodisciplina do 5S no chão de fábrica!',
        methodologyIntro: 'O Kaizen não precisa de meses de reunião. Ele acontece em ações práticas imediatas de 2 minutos no próprio posto.',
        recommendedPillId: 'os-5s'
      },
      {
        text: 'Depende do que for... 🤨',
        reactionSpeech: 'Relaxa! É uma ação minúscula de organização que vai poupar vinte minutos do seu turno!',
        methodologyIntro: 'Pequenos passos, grandes vitórias. Ao organizar um único canto da bancada, o fluxo de trabalho se destrava por inteiro.',
        recommendedPillId: 'os-5s'
      },
      {
        text: 'Tô na maior correria agora! 🏃',
        reactionSpeech: 'Se você não tem 2 minutos para organizar seu trabalho, vai perder horas no retrabalho! Pense nisso!',
        methodologyIntro: 'Quem não tem tempo para afiar o machado passa o dia inteiro cansado cortando lenha com lâmina cega. Pare 2 minutos e melhore seu método!',
        recommendedPillId: 'o-que-e-kaizen'
      },
      {
        text: 'Quero saber o que eu ganho com isso! 🎁',
        reactionSpeech: 'Você ganha menos estresse, menos cansaço no final do dia e o respeito de toda a equipe!',
        methodologyIntro: 'Trabalhar em um ambiente 5S limpo e padronizado eleva o orgulho profissional e garante a segurança física de todos.',
        recommendedPillId: 'os-5s'
      }
    ]
  }
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
    content: '1. Seiri (Utilização/Descarte) • 2. Seiton (Organização/Lugar Certo) • 3. Seiso (Limpeza/Inspeção) • 4. Seiketsu (Padronização) • 5. Shitsuke (Autodisciplina).',
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
