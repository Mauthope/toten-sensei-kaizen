# Toten Sensei Kaizen 🥋🔭 (Sensei IA de Chão de Fábrica)

Sistema de Toten Interativo com **Visão Computacional em Tempo Real**, Inteligência Artificial Generativa **Sensei IA**, síntese de voz nativa, reconhecimento de fala por microfone e gamificação da cultura **Kaizen / 5S** para chão de fábrica e ambientes corporativos.

⚡ **Feito por Mauricio Grigol**

Inspirado na identidade visual tecnológica em **Dark Slate & Glassmorphism** do projeto [`big-bag-calculator`](https://github.com/Mauthope/big-bag-calculator).

---

## ✨ Novidades da Versão 1.3

1. **Canal Kaizen com Entrada por Voz & Estruturação Automática**:
   * O colaborador grava a ideia no microfone do toten ou digita livremente.
   * O **Sensei IA** interpreta a fala, elimina vícios de áudio ou ruídos e estrutura automaticamente a proposta: Título, Categoria, Problema, Solução Prática e Benefícios Esperados.
   * Confirmação em 1 clique com geração instantânea de número de protocolo (`KZ-2026-XXXX`), chuva de confetes e incentivo em voz alta.
2. **Consultoria Direta com Sensei IA**:
   * O Sensei responde imediatamente a qualquer dúvida sobre 5S, Poka-Yoke, eliminação de desperdícios (Muda) e segurança do trabalho.
   * Respostas sintetizadas em voz alta em português brasileiro com cards de balão de fala limpos.
3. **Quadro de Interação Clean & Direto ao Ponto**:
   * Interface despoluída com foco direto nos dois grandes pilares: **💡 Canal Kaizen (Cadastrar Ideia)** e **🥋 Falar com Sensei IA**.
   * Transição fluida de sprites pixel art 32-bit sincronizados com o estado (buscando, comemorando, falando, eureka/ideia e sucesso).
4. **Resiliência e Fallback Inteligente**:
   * Motor de conhecimento local para que o Sensei responda com maestria mesmo sem conexão de rede externa.

---

## 🚀 Principais Funcionalidades

### 1. Visão Computacional & Presença (TensorFlow.js + COCO-SSD)
* **Detecção em Tempo Real**: Rastreia a presença de pessoas na frente do toten utilizando IA via câmera WebRTC com aceleração WebGL.
* **Otimizado para Baixo Consumo**: Inferência ultra-rápida em canvas offscreen (320x240) para manter CPU e GPU frias em operação contínua 24/7.
* **Filtro de Inatividade Inteligente**: Mantém a sessão aberta enquanto o usuário estiver interagindo ou lendo na tela.

### 2. O Personagem "Sensei"
* **Modo Descanso (Idle / Screensaver)**:
  * O Sensei segura um binóculo tecnológico nos olhos e faz varredura animada da área.
  * Sonar cibernético e visor de câmera aberto na metade inferior com guias sci-fi.
* **Modo Ativo (Pessoa Detectada)**:
  * O Sensei comemora a aproximação com confetes e saudações enérgicas em voz alta.
  * Transição instantânea para o painel de interação touch.

### 3. Canal Kaizen & Banco de Ideias
* **Cadastro por Voz**: Fale a ideia naturalmente no microfone.
* **Estruturação por IA**: Classificação automática em categorias (5S, Segurança, Manutenção Autônoma, Desperdício, Qualidade, Produtividade).
* **Protocolo e Histórico**: Consulta de ideias anteriores enviadas no turno.

---

## 🔑 Configuração de API (Opcional)

Para que o Sensei IA utilize modelos em nuvem adicionais:

1. Obtenha uma chave no [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Na **Vercel** ou em `.env.local`:
   * Adicione: `GEMINI_API_KEY=sua_chave_aqui`
3. Salve e faça o deploy.

*(Nota: O sistema possui cérebro local próprio e responde com sabedoria Kaizen mesmo se a chave não estiver configurada).*

---

## ⚖️ Conformidade e LGPD (Lei Geral de Proteção de Dados)

* **100% On-Device (Client-Side)**: O vídeo da câmera é processado estritamente na memória RAM do navegador.
* **Nenhuma Imagem Gravada**: Não há upload para servidores, nuvem ou armazenamento em disco.
* **Sem Biometria**: O modelo apenas detecta a classe genérica de silhueta `person`, sem reconhecimento facial ou identificação de quem é o colaborador.

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
