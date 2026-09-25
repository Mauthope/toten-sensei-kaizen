# Toten Sensei Kaizen 🥋🔭

Sistema de Toten Interativo com **Visão Computacional em Tempo Real**, Inteligência Artificial On-Device, síntese de voz e gamificação de cultura **Kaizen / 5S** para chão de fábrica e ambientes corporativos.

Projetado com a identidade visual moderna em **Dark Slate & Glassmorphism** inspirada no [`big-bag-calculator`](https://github.com/Mauthope/big-bag-calculator).

---

## 🚀 Principais Funcionalidades

### 1. Visão Computacional & Presença (TensorFlow.js + COCO-SSD)
* **Detecção em Tempo Real**: Rastreia a presença de pessoas na frente do toten utilizando inteligência artificial via câmera WebRTC.
* **Otimizado para Baixo Consumo**: Amostragem controlada de frames (~5,5 inferências/segundo) para manter a GPU e CPU frias mesmo em operação contínua 24/7.
* **Filtro de Inatividade (Debounce)**: Tolerância de 3,8 segundos para que movimentos naturais de cabeça não façam o Sensei voltar ao modo de descanso abruptamente.
* **Simulador Integrado**: Painel de diagnóstico com botões para simular presença/ausência de pessoas caso esteja testando em computador sem webcam.

### 2. O Personagem "Sensei"
* **Modo Descanso (Idle / Screensaver)**:
  * O Sensei segura um binóculo de alta tecnologia nos olhos e faz varredura animada da área (esquerda, centro, direita).
  * Frases dinâmicas e bem-humoradas convidando as pessoas a se aproximarem (*"Cadê todo mundo? O Sensei está procurando talentos Kaizen..."*).
  * Radar e sonar cibernético pulsando ao fundo.
* **Modo Ativo (Pessoa Detectada)**:
  * O Sensei abaixa o binóculo, abre um sorriso e acena alegremente!
  * **Síntese de Voz (TTS)**: Fala em português brasileiro natural: *"Olá! Estou te vendo! Você sabe o que é Kaizen?"*.
  * Abre o painel interativo touchscreen.

### 3. Pílulas e Gamificação Kaizen
* **Pergunta Inicial**: O usuário responde se conhece o Kaizen.
* **Explicação Dinâmica**: Pílulas de conhecimento sobre:
  1. *O que é Kaizen? (改善)*
  2. *Metodologia 5S*
  3. *Os 8 Desperdícios (Muda)*
  4. *Vá ao Gemba (現場)*
  5. *Poka-Yoke (À Prova de Erros)*
* **Desafio 5S do Turno**: Uma missão prática de 2 minutos para o colaborador aplicar imediatamente no seu posto de trabalho.
* **Caixa de Sugestões de Melhoria**: Formulário touch para envio de ideias de melhoria contínua com chuva de confetes comemorativa.

### 4. Modo Toten / Kiosk & PWA
* **PWA Instalável**: Suporte a Service Worker offline e Web App Manifest em tela cheia.
* **Screen Wake Lock API**: Impede automaticamente que o monitor do toten entre em descanso ou desligue.
* **Controles Rápidos no Topo**:
  * Alternar Tela Cheia (Fullscreen).
  * Mudo / Ativar Voz do Sensei.
  * Relógio em tempo real.
  * Modal de Conformidade LGPD.

---

## ⚖️ Conformidade e LGPD (Lei Geral de Proteção de Dados)

* **100% On-Device (Client-Side)**: O vídeo da câmera é processado estritamente na memória volátil (RAM) do navegador.
* **Nenhuma Imagem Gravada**: Não há upload para servidores, nuvem ou armazenamento em disco.
* **Sem Biometria**: O modelo apenas detecta a classe genérica de silhueta `person`, sem reconhecimento facial ou identificação de quem é o colaborador.
* **Licenciamento 100% Open-Source**: Baseado em bibliotecas sob licença **Apache 2.0** e **MIT**, livre de royalties e seguro para uso corporativo.

---

## 🛠️ Tecnologias Utilizadas

* **Framework**: Next.js 14 (App Router)
* **Linguagem**: TypeScript
* **Estilização**: Tailwind CSS + Glassmorphism + Outfit Font (Google Fonts)
* **Inteligência Artificial**: `@tensorflow/tfjs` + `@tensorflow-models/coco-ssd`
* **Animações**: Framer Motion
* **Efeitos**: Canvas-Confetti + SVG Animations
* **Ícones**: Lucide React
* **Voz**: Web Speech API Nativa

---

## 💻 Como Rodar o Projeto

### Modo de Desenvolvimento
```bash
npm run dev
```
Acesse no navegador: `http://localhost:3000`

### Modo de Produção (Recomendado para o Toten)
```bash
npm run build
npm start
```

### Dica para Inicialização Automática no Toten (Windows Kiosk)
Você pode criar um atalho no Windows para abrir o Google Chrome ou Microsoft Edge direto em modo Kiosk de tela cheia sem barras de navegação:
```cmd
chrome.exe --kiosk --disable-features=Translate --no-first-run --app=http://localhost:3000
```
