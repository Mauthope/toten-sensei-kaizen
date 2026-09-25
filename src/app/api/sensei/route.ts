import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SENSEI_CHAT_INSTRUCTION = `
Você é o "Sensei Kaizen" 🥋, o guardião da Melhoria Contínua e da metodologia 5S em um toten interativo no chão de fábrica e áreas corporativas.
Sua personalidade é sábia, enérgica, acolhedora, bem-humorada e altamente motivadora.

Diretrizes obrigatórias para CHAT:
1. Suas respostas serão FALADAS EM VOZ ALTA pelo sintetizador de voz do toten. Responda em Português do Brasil de forma concisa, direta e natural (máximo de 2 a 3 frases curtas).
2. Não utilize listas longas ou tabelas. Use frases diretas, impactantes e fáceis de ouvir.
3. Foque sempre na filosofia Kaizen: pequenos passos diários, eliminação de desperdícios (espera, retrabalho, movimentação), disciplina no 5S e valorização do trabalho em equipe.
4. Finalize com uma pergunta instigante ou frase motivadora para o turno de trabalho.
`;

const SENSEI_IDEA_REFINE_INSTRUCTION = `
Você é o especialista Lean Manufacturing e Consultor Kaizen da fábrica.
O operador acabou de falar uma ideia de melhoria através do microfone do toten.
Como a detecção de voz no chão de fábrica pode conter ruídos de fundo, palavras cortadas, erros gramaticais ou frases informais/gírias, seu trabalho é INTERPRETAR a intenção real do colaborador e LAPIDAR essa ideia em uma proposta Kaizen estruturada, clara e profissional.

Mantenha a essência exata do que o operador quis dizer, mas com terminologia clara de fábrica/melhoria contínua.

Sua resposta DEVE SER ESTRITAMENTE UM JSON válido (sem formatações extras fora do json), com a seguinte estrutura:
{
  "title": "Título curto, claro e direto da melhoria (máx 8 palavras)",
  "category": "Uma entre: 5S & Organização | Segurança no Trabalho | Eliminação de Desperdício | Manutenção Autônoma | Qualidade & Poka-Yoke | Agilidade & Produtividade",
  "problem": "Descrição clara do problema ou oportunidade identificada pelo operador no posto de trabalho.",
  "solution": "Ação prática e viável proposta para solucionar o problema.",
  "benefits": "Benefício esperado (ex: mais segurança, ganho de tempo, redução de retrabalho ou peças defeituosas).",
  "senseiEncouragement": "Frase curta (máx 15 palavras) do Sensei parabenizando e incentivando o operador pela iniciativa."
}
`;

// Smart Fallback Parser if Gemini API Key is not set or network fails
function generateFallbackRefinedIdea(rawText: string) {
  const cleaned = rawText.trim();
  const lower = cleaned.toLowerCase();

  let category = "Eliminação de Desperdício";
  if (lower.includes("seguran") || lower.includes("epi") || lower.includes("acidente") || lower.includes("risco") || lower.includes("cair")) {
    category = "Segurança no Trabalho";
  } else if (lower.includes("limp") || lower.includes("organiz") || lower.includes("ferramenta") || lower.includes("bancada") || lower.includes("chão")) {
    category = "5S & Organização";
  } else if (lower.includes("manuten") || lower.includes("quebr") || lower.includes("barulho") || lower.includes("oleo") || lower.includes("peça")) {
    category = "Manutenção Autônoma";
  } else if (lower.includes("defeito") || lower.includes("erro") || lower.includes("qualidade") || lower.includes("errad")) {
    category = "Qualidade & Poka-Yoke";
  } else if (lower.includes("rápido") || lower.includes("tempo") || lower.includes("demor") || lower.includes("espera") || lower.includes("fila")) {
    category = "Agilidade & Produtividade";
  }

  // Capitalize first letter
  const formattedText = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

  return {
    title: `Melhoria Kaizen: ${formattedText.slice(0, 45)}${formattedText.length > 45 ? '...' : ''}`,
    category,
    problem: `Oportunidade observada no posto: "${formattedText}".`,
    solution: `Implementar ajuste prático e padronização com a equipe para solucionar o ponto apontado.`,
    benefits: `Mais eficiência no posto de trabalho, segurança para o time e eliminação de retrabalhos.`,
    senseiEncouragement: `Excelente iniciativa do Gemba! Ideias práticas transformam nosso chão de fábrica!`
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'chat', message, rawText } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    // ==========================================
    // ACTION: REFINE IDEA FOR CANAL KAIZEN
    // ==========================================
    if (action === 'refine_idea') {
      const textToRefine = rawText || message;
      if (!textToRefine || typeof textToRefine !== 'string' || !textToRefine.trim()) {
        return NextResponse.json(
          { error: 'Texto ou transcrição de voz ausente para refinamento.' },
          { status: 400 }
        );
      }

      // If no API Key configured in Vercel yet, use smart fallback
      if (!apiKey) {
        console.warn("GEMINI_API_KEY not configured. Using smart fallback for idea refinement.");
        const fallback = generateFallbackRefinedIdea(textToRefine);
        return NextResponse.json({
          success: true,
          data: fallback,
          note: 'Lapidação local ativa. Configure GEMINI_API_KEY na Vercel para análise por IA Gemini.'
        });
      }

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: SENSEI_IDEA_REFINE_INSTRUCTION,
          generationConfig: {
            responseMimeType: "application/json"
          }
        });

        const prompt = `Analise e lapide esta transcrição de voz enviada pelo operador para o Canal Kaizen:\n"${textToRefine}"`;
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse JSON safely
        let structuredData;
        try {
          // Remove potential markdown fences just in case
          const cleanJson = responseText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/, '$1').trim();
          structuredData = JSON.parse(cleanJson);
        } catch (jsonErr) {
          console.warn("Falha ao parsear JSON do Gemini, usando fallback estruturado:", jsonErr);
          structuredData = generateFallbackRefinedIdea(textToRefine);
        }

        return NextResponse.json({
          success: true,
          data: structuredData
        });
      } catch (geminiErr: any) {
        console.warn("Erro ao chamar Gemini para refinar ideia:", geminiErr);
        const fallback = generateFallbackRefinedIdea(textToRefine);
        return NextResponse.json({
          success: true,
          data: fallback,
          warning: 'Falha temporária na IA Gemini, proposta estruturada pelo assistente local.'
        });
      }
    }

    // ==========================================
    // ACTION: REGULAR SENSEI CHAT / VOICE
    // ==========================================
    const userMessage = message || rawText;
    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json(
        { error: 'Mensagem inválida ou ausente.' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not configured yet.");
      const fallbackResponses = [
        "Kaizen significa mudar para melhor todos os dias! Identifique um desperdício no seu posto agora e elimine-o com orgulho!",
        "Um chão de fábrica organizado com 5S é sinônimo de segurança e agilidade! Qual ferramenta você pode guardar no lugar certo hoje?",
        "Não deixe para amanhã a melhoria que você pode fazer no turno de hoje! Vá ao Gemba e veja com seus próprios olhos!",
        "Pequenas melhorias de 1% ao dia constroem resultados gigantescos ao longo do ano. O que vamos melhorar juntos hoje?",
        "Tem uma ideia bacana? Use o Canal Kaizen no toten para cadastrá-la agora mesmo!"
      ];
      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      return NextResponse.json({
        response: randomResponse,
        note: 'Dica: Configure a variável GEMINI_API_KEY na Vercel para ativar respostas 100% personalizadas de IA.'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SENSEI_CHAT_INSTRUCTION
    });

    const result = await model.generateContent(userMessage);
    const text = result.response.text();

    return NextResponse.json({
      response: text.trim()
    });
  } catch (error: any) {
    console.error("Erro na API do Gemini:", error);
    return NextResponse.json(
      { 
        error: error.message || 'Falha ao consultar o Sensei.',
        response: 'Opa, tive uma pequena oscilação na rede, mas lembre-se: um dia sem melhoria é um dia perdido! Qual é a sua ideia para hoje?' 
      },
      { status: 500 }
    );
  }
}
