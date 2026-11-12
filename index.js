require('dotenv').config();

const express = require('express');
const PDFDocument = require('pdfkit');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/', (req, res) => {
  res.send('API Didactis está online e funcionando!');
});

app.post('/api/ia/chat', async (req, res) => {
  try {
    const { mensagem } = req.body || {};
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: `Você é a IA Assistente Pedagógica do Didactis, especializada em auxiliar professores do 5º Ano do Ensino Fundamental. Ajude a Profª Eliene da Silva Santos a criar pareceres, planos de aula e dinâmicas.`
    });

    const result = await model.generateContent(mensagem);
    res.json({ resposta: result.response.text() });
  } catch (error) {
    console.error('Erro no Chat IA:', error);
    res.status(500).json({ error: 'Erro ao processar mensagem com a IA.' });
  }
});
async function chamarGemini(prompt, systemInstruction = '') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Chave GEMINI_API_KEY não encontrada no .env');

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  const body = { contents: [{ parts: [{ text: prompt }] }] };
  if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `Erro HTTP ${response.status}`);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta da IA.';
}

function enviarPdfBuffer(res, doc, filename) {
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => {
    const pdfBuffer = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${filename}`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  });
  doc.end();
}

app.post('/api/ia/chat', async (req, res) => {
  try {
    const { mensagem } = req.body || {};
    const instrucao = 'Você é a IA Assistente Pedagógica do Didactis, especializada no 5º Ano do Ensino Fundamental. Ajude a Profª Eliene da Silva Santos com planos de aula alinhados à BNCC, atividades e pareceres.';
    const resposta = await chamarGemini(mensagem, instrucao);
    res.json({ resposta });
  } catch (error) {
    res.json({ resposta: `⚠️ Erro na IA: ${error.message}` });
  }
});

app.post('/api/ia/gerar-questoes', async (req, res) => {
  try {
    const { materia, tema, quantidade, tipo } = req.body || {};
    const prompt = `Crie ${quantidade || 5} questões de avaliação para o 5º Ano do Ensino Fundamental.\nDisciplina: ${materia}\nTema: ${tema}\nFormato: ${tipo}\nNumere as questões e inclua um GABARITO PARA A PROFESSORA no final.`;
    const questoes = await chamarGemini(prompt);
    res.json({ questoes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ia/gerar-texto', async (req, res) => {
  try {
    const { aluno, pontosFortes, observacoes } = req.body || {};
    const prompt = `Escreva um parecer descritivo empático e alinhado à BNCC para o(a) aluno(a) do 5º ano: ${aluno}.\nPontos fortes: ${pontosFortes}\nAspectos a desenvolver: ${observacoes}\nGere 2 a 3 parágrafos fluidos, sem títulos.`;
    const texto = await chamarGemini(prompt);
    res.json({ texto });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ia/gerar-questoes', async (req, res) => {
  try {
    const { materia, tema, quantidade, tipo } = req.body || {};

    const prompt = `Crie ${quantidade || 5} questões de avaliação para uma turma de 5º Ano do Ensino Fundamental.
Disciplina: ${materia || 'Português'}
Tema/Conteúdo: ${tema}
Formato: ${tipo || 'Mista (objetivas e dissertativas)'}

Regras:
- Linguagem clara, adequada para alunos de 10 a 11 anos e alinhada à BNCC.
- Numere cada questão (1, 2, 3...).
- No final, coloque uma seção separada chamada "GABARITO PARA A PROFESSORA" com as respostas esperadas.`;

    const questoes = await chamarGemini(prompt);
    res.json({ questoes });
  } catch (error) {
    console.error('Erro ao gerar questões:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/capas/gerar-pdf', (req, res) => {
  const {
    escola = "ESCOLA MUNICIPAL ARLETE GÓIS",
    professora = "Eliene da Silva Santos",
    turma = "5º Ano",
    unidade = "1ª UNIDADE",
    anoLetivo = "2027",
    alunos = ["Ana Souza", "Bruno Lima", "Carla Dias", "Daniel Oliveira"]
  } = req.body || {};

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename=capas_portfolio.pdf');

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(res);

  alunos.forEach((nomeAluno, index) => {
    if (index > 0) doc.addPage();

    doc.roundedRect(25, 25, 545, 792, 10).lineWidth(2).stroke('#2e5b88');
    doc.roundedRect(30, 30, 535, 782, 8).lineWidth(0.8).stroke('#6ba3d6');

    doc.font('Helvetica-Bold')
       .fontSize(16)
       .fillColor('#1a365d')
       .text(escola.toUpperCase(), { align: 'center' })
       .moveDown(0.4);

    doc.font('Helvetica')
       .fontSize(11)
       .fillColor('#4a5568')
       .text(`PROFESSORA: ${professora.toUpperCase()}`, { align: 'center' })
       .text(`TURMA: ${turma}   |   ANO LETIVO: ${anoLetivo}`, { align: 'center' })
       .moveDown(1.5);

    doc.font('Helvetica-Bold')
       .fontSize(22)
       .fillColor('#2b6cb0')
       .text('PORTFÓLIO DE APRENDIZAGENS', { align: 'center' })
       .moveDown(0.2);

    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor('#4a5568')
       .text(`— ${unidade.toUpperCase()} —`, { align: 'center' })
       .moveDown(2);

    doc.roundedRect(137, 240, 320, 260, 12)
       .dash(4, { space: 6 })
       .lineWidth(1.5)
       .stroke('#cbd5e0');
    doc.undash();

    doc.font('Helvetica-Oblique')
       .fontSize(10)
       .fillColor('#a0aec0')
       .text('[ Espaço para Foto ou Desenho do Aluno ]', 137, 365, { width: 320, align: 'center' });

    doc.roundedRect(60, 540, 475, 70, 8)
       .fillAndStroke('#f7fafc', '#cbd5e0');

    doc.font('Helvetica-Bold')
       .fontSize(11)
       .fillColor('#718096')
       .text('ESTUDANTE', 60, 552, { width: 475, align: 'center' });

    doc.font('Helvetica-Bold')
       .fontSize(20)
       .fillColor('#1a365d')
       .text(nomeAluno.toUpperCase(), 60, 570, { width: 475, align: 'center' });
  });

  doc.end();
});

app.post('/api/relatorios/gerar-pdf', (req, res) => {
  const {
    escola = "ESCOLA MUNICIPAL ARLETE GÓIS",
    inep = "29059526",
    cnpj = "05.059.070/0001-39",
    endereco = "Rua Euclides da Cunha, 181 | Cafarnaum-BA",
    professora = "Eliene da Silva Santos",
    diretora = "Sirlei Sena de Oliveira",
    email = "earletegois@gmail.com",
    aluno = "Estudante",
    turma = "5º Ano",
    unidade = "1ª UNIDADE",
    anoLetivo = "2026",
    texto = ""
  } = req.body || {};

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const logoPath = path.join(__dirname, 'public', 'assets', 'images', 'logo-arlete-gois.png');

  let startY = 45;

  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 270, startY, { width: 55 });
      startY += 62;
    } catch (err) {
      console.warn('Logo ignorada:', err.message);
    }
  }

  doc.font('Helvetica-Bold').fontSize(13).fillColor('#1a365d')
     .text(escola.toUpperCase(), 50, startY, { width: 495, align: 'center' });

  doc.font('Helvetica').fontSize(9).fillColor('#4a5568')
     .text(`INEP: ${inep}  |  CNPJ: ${cnpj}`, 50, doc.y + 3, { width: 495, align: 'center' })
     .text(endereco, 50, doc.y + 2, { width: 495, align: 'center' });

  startY = doc.y + 12;

  doc.moveTo(50, startY).lineTo(545, startY).lineWidth(1).stroke('#cbd5e0');

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#2b6cb0')
     .text(`RELATÓRIO INDIVIDUAL DO ALUNO | ${anoLetivo}`, 50, startY + 15, { align: 'center' });

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#1a365d')
     .text(`ALUNO(A): ${aluno.toUpperCase()}  |  ${turma} — ${unidade.toUpperCase()}`, 50, doc.y + 5, { align: 'center' });

  doc.font('Helvetica').fontSize(11).fillColor('#2d3748')
     .text(texto, 50, doc.y + 20, { width: 495, align: 'justify', lineGap: 5 });

  const footerY = 720;
  doc.moveTo(50, footerY - 15).lineTo(545, footerY - 15).lineWidth(0.5).stroke('#e2e8f0');

  doc.font('Helvetica').fontSize(10).fillColor('#2d3748')
     .text(`Professora: ${professora}`, 50, footerY)
     .text(`Diretora: ${diretora}`, 50, footerY + 16)
     .text(`E-mail: ${email}`, 50, footerY + 32);

  enviarPdfBuffer(res, doc, `relatorio_${aluno.toLowerCase().replace(/\s+/g, '_')}.pdf`);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor Didactis rodando na porta ${PORT}`);
});