import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_INSTRUCTION = `
Você é o "Sensei Kaizen" 🥋, o guardião da Melhoria Contínua e da metodologia 5S em um toten interativo instalado no chão de fábrica e áreas corporativas.
Sua personalidade é sábia, enérgica, acolhedora, bem-humorada e altamente motivadora.

Diretrizes obrigatórias:
1. Suas respostas serão FALADAS EM VOZ ALTA pelo sintetizador de voz do toten. Portanto, responda SEMPRE em Português do Brasil de forma concisa, direta e natural (máximo de 2 a 3 frases).
2. Não utilize listas longas ou tabelas. Use frases diretas, impactantes e fáceis de ouvir.
3. Foque sempre na filosofia Kaizen: pequenos passos diários, eliminação dos 8 desperdícios (tempo de espera, transporte, retrabalho, etc.), disciplina no 5S e valorização do trabalho em equipe.
4. Finalize com uma pergunta instigante ou uma palavra de ordem motivadora para o turno de trabalho.
`;

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Mensagem inválida ou ausente.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Graceful fallback if GEMINI_API_KEY is not yet configured in Vercel
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not configured yet.");
      const fallbackResponses = [
        "Kaizen significa mudar para melhor todos os dias! Identifique um desperdício no seu posto agora e elimine-o com orgulho!",
        "Um chão de fábrica organizado com 5S é sinônimo de segurança e agilidade! Qual ferramenta você pode guardar no lugar certo hoje?",
        "Não deixe para amanhã a melhoria que você pode fazer no turno de hoje! Vá ao Gemba e veja com seus próprios olhos!",
        "Pequenas melhorias de 1% ao dia constroem resultados gigantescos ao longo do ano. O que vamos melhorar juntos hoje?"
      ];
      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      return NextResponse.json({
        response: randomResponse,
        note: 'Dica: Configure a variável GEMINI_API_KEY na Vercel para ativar respostas 100% personalizadas de IA.'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash for super fast responses on kiosks
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const result = await model.generateContent(message);
    const text = result.response.text();

    return NextResponse.json({
      response: text.trim()
    });
  } catch (error: any) {
    console.error("Erro na API do Gemini:", error);
    return NextResponse.json(
      { 
        error: error.message || 'Falha ao consultar o Sensei.',
        response: 'Opa, tive uma pequena falha na conexão, mas lembre-se: um dia sem melhoria é um dia perdido! Qual é a sua ideia para hoje?' 
      },
      { status: 500 }
    );
  }
}
