# Toten Sensei Kaizen 🥋🔭 (Powered by Google Gemini IA)

Sistema de Toten Interativo com **Visão Computacional em Tempo Real**, Inteligência Artificial Generativa **Google Gemini**, síntese de voz nativa, reconhecimento de fala por microfone e gamificação da cultura **Kaizen / 5S** para chão de fábrica e ambientes corporativos.

Inspirado na identidade visual tecnológica em **Dark Slate & Glassmorphism** do projeto [`big-bag-calculator`](https://github.com/Mauthope/big-bag-calculator).

---

## ✨ Novidades da Versão 1.1

1. **Inteligência Artificial Google Gemini (`gemini-1.5-flash`)**:
   * O Sensei agora responde a qualquer pergunta técnica sobre Lean Manufacturing, 5S, eliminação de desperdícios (Muda) ou rotina da fábrica.
   * **Respostas Faladas**: O Sensei sintetiza a resposta da IA em voz alta em português brasileiro.
   * **Reconhecimento de Voz (Microfone)**: O usuário pode falar a pergunta diretamente para o toten ou digitar na tela.
2. **Seleção e Troca de Câmeras (Frontal vs. Traseira)**:
   * Botão de alternância rápida entre Câmera Frontal (Selfie) e Câmera Traseira (Ambiente).
   * Suporte a seleção de webcams USB externas via menu dropdown de dispositivos.
   * Resolução do fluxo de captura com montagem persistente do elemento de vídeo.

---

## 🚀 Principais Funcionalidades

### 1. Visão Computacional & Presença (TensorFlow.js + COCO-SSD)
* **Detecção em Tempo Real**: Rastreia a presença de pessoas na frente do toten utilizando IA via câmera WebRTC.
* **Otimizado para Baixo Consumo**: Amostragem controlada de frames (~5,5 inferências/segundo) para manter a GPU e CPU frias mesmo em operação contínua 24/7.
* **Filtro de Inatividade (Debounce)**: Tolerância de 3,8 segundos para movimentos naturais de cabeça.
* **Simulador Integrado**: Painel de diagnóstico com botões para simular presença/ausência de pessoas caso esteja testando em computador sem webcam.

### 2. O Personagem "Sensei"
* **Modo Descanso (Idle / Screensaver)**:
  * O Sensei segura um binóculo tecnológico nos olhos e faz varredura animada da área (esquerda, centro, direita).
  * Frases dinâmicas convidando as pessoas a se aproximarem (*"Cadê todo mundo? O Sensei está procurando talentos Kaizen..."*).
  * Radar e sonar cibernético pulsando ao fundo.
* **Modo Ativo (Pessoa Detectada)**:
  * O Sensei abaixa o binóculo, abre um sorriso e acena alegremente!
  * **Síntese de Voz (TTS)**: Fala em português brasileiro natural: *"Olá! Estou te vendo! Você sabe o que é Kaizen?"*.
  * Abre o painel interativo touchscreen.

### 3. Pílulas e Gamificação Kaizen
* **Bate-Papo com Gemini IA**: Tire dúvidas sobre 5S, segurança e melhoria contínua por voz ou texto.
* **Pergunta Inicial**: Avaliação rápida de conhecimento.
* **Pílulas Interativas**: *O que é Kaizen*, *Os 5S*, *Os 8 Desperdícios*, *Gemba*, *Poka-Yoke*.
* **Desafio 5S do Turno**: Missão prática de 2 minutos para aplicar no setor.
* **Banco de Ideias**: Envio de sugestões de melhoria com chuva de confetes.

---

## 🔑 Configuração da Variável Gemini na Vercel

Para que o Sensei utilize o cérebro da Google Gemini IA:

1. Obtenha uma chave gratuita da API no [Google AI Studio](https://aistudio.google.com/app/apikey).
2. No painel da **Vercel** do seu projeto:
   * Vá em **Settings** > **Environment Variables**.
   * Adicione a chave:
     * **Key**: `GEMINI_API_KEY`
     * **Value**: *sua_chave_gerada_aqui*
   * Marque os ambientes **Production**, **Preview** e **Development**.
   * Salve e faça um redeploy.

*(Nota: Caso a variável não esteja preenchida, o sistema entra automaticamente em modo de contingência inteligente com respostas Kaizen pré-carregadas).*

---

## ⚖️ Conformidade e LGPD (Lei Geral de Proteção de Dados)

* **100% On-Device (Client-Side)**: O vídeo da câmera é processado estritamente na memória RAM do navegador.
* **Nenhuma Imagem Gravada**: Não há upload para servidores, nuvem ou armazenamento em disco.
* **Sem Biometria**: O modelo apenas detecta a classe genérica de silhueta `person`, sem reconhecimento facial ou identificação de quem é o colaborador.
* **Licenciamento 100% Open-Source**: Baseado em bibliotecas sob licença **Apache 2.0** e **MIT**.

---

## 💻 Como Rodar Localmente

```bash
# Instalar dependências
npm install

# Executar servidor de desenvolvimento
npm run dev

# Ou build e start de produção:
npm run build
npm start
```
