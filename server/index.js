const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const multer = require('multer');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configura Multer para salvar os uploads em memória (ideal para Vercel Serverless)
const upload = multer({ storage: multer.memoryStorage() });

// Initialize OpenAI API
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: OPENAI_API_KEY is not defined.");
}
const openai = new OpenAI({ apiKey: apiKey });

// Função manual para dividir texto em chunks (passo 3 do fluxo)
function chunkText(text, maxChunkSize = 1000) {
  const words = text.split(/\s+/);
  const chunks = [];
  let currentChunk = [];

  for (const word of words) {
    currentChunk.push(word);
    // Se o chunk passar do tamanho máximo
    if (currentChunk.join(' ').length >= maxChunkSize) {
      chunks.push(currentChunk.join(' '));
      // Manter um overlap de 20 palavras para não perder contexto
      currentChunk = currentChunk.slice(-20);
    }
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }
  return chunks;
}

// Fallback robusto para extrair texto de PDFs caso o pdf-parse dê erro de empacotamento na Vercel
function extractTextFromPdfBufferFallback(buffer) {
  const content = buffer.toString('binary');
  const regex = /\(([^)]+)\)\s*(?:Tj|TJ)/g;
  let match;
  let text = '';
  while ((match = regex.exec(content)) !== null) {
    text += match[1] + ' ';
  }
  return text.trim() || buffer.toString('utf-8');
}

// Google connection simulation state (stored in server memory)
let isGoogleConnected = false;

// ==========================================
// ROTAS DE INTEGRAÇÃO GOOGLE (MOCK)
// ==========================================

// Rota de status de conexão do Google
app.get('/api/google/status', (req, res) => {
  res.json({
    calendar: isGoogleConnected,
    gmail: isGoogleConnected,
    drive: isGoogleConnected
  });
});

// Redirecionamento para Autenticação Google Simulada
app.get('/api/google/auth', (req, res) => {
  isGoogleConnected = true; // Ativa a conexão!
  res.send(`
    <html>
      <head>
        <title>Hota.chat - Conexão Google</title>
        <meta charset="utf-8">
      </head>
      <body style="font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #202123; color: white; margin: 0; padding: 20px; text-align: center;">
        <div style="background-color: #343541; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); max-width: 400px; border: 1px solid #4d4d4f;">
          <div style="font-size: 48px; margin-bottom: 20px;">🎓</div>
          <h1 style="color: #10a37f; margin: 0 0 10px 0; font-size: 24px;">Conta Google Conectada!</h1>
          <p style="color: #c5c5d2; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
            Sua conta acadêmica foi integrada com sucesso. O Hota.chat agora pode acessar seus prazos, avisos e arquivos do Drive.
          </p>
          <button onclick="window.close()" style="background-color: #10a37f; hover:background-color: #1a7f64; color: white; border: none; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 14px; width: 100%; transition: background 0.2s;">
            Fechar Janela
          </button>
        </div>
      </body>
    </html>
  `);
});

// Próximas Atividades (Calendar)
app.get('/api/google/calendar/events', (req, res) => {
  if (!isGoogleConnected) {
    return res.json({ events: [] });
  }
  res.json({
    events: [
      { id: "1", title: "Entrega: Trabalho de Inteligência Artificial (pgvector)", date: "Amanhã", time: "23:59", link: "https://calendar.google.com" },
      { id: "2", title: "Prova Presencial: Engenharia de Software II", date: "22/05/2026", time: "08:00" },
      { id: "3", title: "Apresentação: Pré-Banca de TCC", date: "26/05/2026", time: "14:00" }
    ]
  });
});

// Avisos Recentes (Gmail)
app.get('/api/google/gmail/messages', (req, res) => {
  if (!isGoogleConnected) {
    return res.json({ messages: [] });
  }
  res.json({
    messages: [
      { id: "1", subject: "Alteração de sala da aula prática", sender: "Prof. Ricardo (Compiladores)", date: "14:32", snippet: "Prezados alunos, excepcionalmente hoje nossa aula prática ocorrerá na Sala 402 do Bloco C..." },
      { id: "2", subject: "Confirmação de inscrição no Simpósio", sender: "Portal de Eventos Acadêmicos", date: "Ontem", snippet: "Sua inscrição para o Simpósio de Computação Aplicada foi confirmada com sucesso. O credenciamento inicia às..." },
      { id: "3", subject: "Nota da primeira prova disponibilizada", sender: "Sistema Acadêmico Siga", date: "18 de Mai", snippet: "A nota da primeira avaliação teórica de Algoritmos foi lançada no portal. A revisão de prova será na..." }
    ]
  });
});

// Arquivos Recentes (Drive)
app.get('/api/google/drive/files', (req, res) => {
  if (!isGoogleConnected) {
    return res.json({ files: [] });
  }
  res.json({
    files: [
      { id: "1", name: "Apostila_Redes_de_Computadores.pdf", mimeType: "application/pdf", lastModified: "Ontem", link: "https://drive.google.com" },
      { id: "2", name: "Resumo_Física_Estática.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", lastModified: "12 de Mai", link: "https://drive.google.com" },
      { id: "3", name: "Planilha_Notas_Calculo.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", lastModified: "08 de Mai", link: "https://drive.google.com" }
    ]
  });
});


// ==========================================
// ROTA 3: UPLOAD & INGESTÃO DE RAG (LAZY LOADED)
// ==========================================
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: "Banco vetorial PostgreSQL não configurado (DATABASE_URL)." });
    }

    let text = "";
    
    // Passo 2: Extrair texto (suporta txt e pdf) com lazy load e fallback
    if (req.file.mimetype === 'application/pdf') {
      try {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(req.file.buffer);
        text = pdfData.text;
      } catch (pdfErr) {
        console.warn("pdf-parse failed on server, using fast fallback text extractor:", pdfErr);
        text = extractTextFromPdfBufferFallback(req.file.buffer);
      }
    } else {
      text = req.file.buffer.toString('utf-8');
    }

    // Passo 3: Dividir texto em chunks
    const chunks = chunkText(text, 1000);
    
    // Lazy load do Pool de Banco de dados
    const { pool, initDB } = require('./db');
    await initDB();
    
    const client = await pool.connect();
    
    // Passos 4 e 5: Gerar Embeddings e Salvar no Banco
    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
      });
      
      const embedding = embeddingResponse.data[0].embedding;
      const embeddingString = `[${embedding.join(',')}]`; // Formato exigido pelo pgvector
      
      await client.query(
        'INSERT INTO documents (content, embedding) VALUES ($1, $2)',
        [chunk, embeddingString]
      );
    }
    
    client.release();

    res.json({ success: true, message: `Documento processado! ${chunks.length} partes foram salvas no banco vetorial.` });
  } catch (error) {
    console.error("Erro no upload RAG:", error);
    res.status(500).json({ error: "Erro ao processar e salvar o documento.", details: error.message });
  }
});


// ==========================================
// ROTA 4: CHAT & RECUPERAÇÃO RAG (LAZY LOADED)
// ==========================================
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) return res.status(400).json({ error: "Message is required." });
    if (!apiKey) return res.status(500).json({ error: "OpenAI API key is missing." });

    let contextText = "";

    // Passo 6 e 7: Buscar no banco vetorial (se configurado) com lazy load
    if (process.env.DATABASE_URL) {
      try {
        const { pool, initDB } = require('./db');
        await initDB();

        // Gera embedding da pergunta do usuário
        const questionEmbeddingRes = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: message,
        });
        const questionEmbedding = questionEmbeddingRes.data[0].embedding;
        const qEmbedStr = `[${questionEmbedding.join(',')}]`;

        // Busca os 3 chunks mais similares usando Distância de Cosseno (<=>)
        const client = await pool.connect();
        const result = await client.query(`
          SELECT content, 1 - (embedding <=> $1) as similarity 
          FROM documents 
          ORDER BY embedding <=> $1 LIMIT 3
        `, [qEmbedStr]);
        client.release();

        if (result.rows.length > 0) {
          contextText = result.rows.map(row => row.content).join("\n\n---\n\n");
        }
      } catch (dbErr) {
        console.error("Erro ao buscar contexto vetorial:", dbErr);
      }
    }

    // Formata o histórico
    const formattedHistory = (history || []).map(item => ({
      role: item.role === 'user' ? 'user' : 'assistant',
      content: item.content,
    }));

    // Passo 8: Montar prompt combinando o contexto + a pergunta
    let systemMessage = {
      role: 'system',
      content: 'Você é o Hota.chat, um assistente acadêmico inteligente. Ajude os estudantes a organizar rotinas, resumir e tirar dúvidas das matérias de forma clara.'
    };

    if (contextText) {
      systemMessage.content += `\n\nINSTRUÇÃO RAG: Utilize APENAS o contexto abaixo fornecido pelo banco vetorial para responder à pergunta. Se a informação não estiver no contexto, diga que não sabe baseando-se nos documentos enviados.\n\n<contexto>\n${contextText}\n</contexto>`;
    }

    const messages = [
      systemMessage,
      ...formattedHistory,
      { role: 'user', content: message }
    ];

    // Passo 9: Responder
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error("Error em /api/chat:", error);
    res.status(500).json({ error: "Ocorreu um erro no servidor.", details: error.message });
  }
});

// Export the app for Vercel Serverless Functions
module.exports = app;

// Start the server locally (Vercel bypasses this)
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Hota.chat Backend running on http://localhost:${port}`);
  });
}
