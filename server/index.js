const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { pool, initDB } = require('./db');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configura Multer para salvar os uploads em memória (ideal para Vercel Serverless)
const upload = multer({ storage: multer.memoryStorage() });

// Initialize DB and pgvector extension
initDB();

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

// ==========================================
// ROTA 1: UPLOAD & INGESTÃO DE RAG
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
    
    // Passo 2: Extrair texto (suporta txt e pdf)
    if (req.file.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(req.file.buffer);
      text = pdfData.text;
    } else {
      text = req.file.buffer.toString('utf-8');
    }

    // Passo 3: Dividir texto em chunks
    const chunks = chunkText(text, 1000);
    
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
// ROTA 2: CHAT & RECUPERAÇÃO RAG
// ==========================================
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) return res.status(400).json({ error: "Message is required." });
    if (!apiKey) return res.status(500).json({ error: "OpenAI API key is missing." });

    let contextText = "";

    // Passo 6 e 7: Buscar no banco vetorial (se configurado)
    if (process.env.DATABASE_URL) {
      try {
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
      content: 'Você é o Hota.chat, um assistente inteligente. Responda de forma clara.'
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
