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


async function chamarGemini(prompt, systemInstruction = '') {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error('Chave GROQ_API_KEY não encontrada no .env');

  const modelsRes = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { 'Authorization': `Bearer ${groqKey}` }
  });
  const modelsData = await modelsRes.json();
  if (!modelsRes.ok) throw new Error(modelsData.error?.message || `Erro Groq (${modelsRes.status})`);

  const modelosTexto = (modelsData.data || [])
    .map((m) => m.id)
    .filter((id) => !/whisper|guard|tts|embed|vision|orpheus/i.test(id));

  const prioridades = [/llama-3\.1-8b-instant/i, /llama-4/i, /llama.*70b|versatile/i, /gemma/i, /qwen/i];
  const candidatos = [
    ...prioridades.flatMap((r) => modelosTexto.filter((id) => r.test(id))),
    ...modelosTexto
  ].filter((id, idx, arr) => arr.indexOf(id) === idx);

  const messages = [];
  if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
  messages.push({ role: 'user', content: prompt });

  let ultimoErro = 'Limite temporário atingido nos modelos da Groq.';
  for (const modelo of candidatos) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
      body: JSON.stringify({ model: modelo, messages, temperature: 0.7 })
    });
    const data = await response.json();
    if (response.ok) return data.choices?.[0]?.message?.content || 'Sem resposta da IA.';
    ultimoErro = data.error?.message || `Erro na Groq (${response.status})`;
    if (![400, 404, 429, 503].includes(response.status)) throw new Error(ultimoErro);
  }
  throw new Error(ultimoErro);
}

function enviarPdfBuffer(res, doc, filename) {
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => {
    const pdfBuffer = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  });
  doc.end();
}

app.get('/', (req, res) => {
  res.send('API Didactis está online e funcionando!');
});

app.post('/api/ia/chat', async (req, res) => {
  try {
    const { mensagem, historico = [] } = req.body || {};
    const instrucao = 'Você é a IA Assistente Pedagógica do Didactis, especializada no 5º Ano do Ensino Fundamental. Ajude a Profª Eliene da Silva Santos com planos de aula alinhados à BNCC, atividades e relatórios.';

    const promptComContexto = Array.isArray(historico) && historico.length > 0
      ? historico.slice(-8).map((m) => `${m.role === 'user' ? 'Professora' : 'Assistente'}: ${m.content}`).join('\n') + `\nProfessora: ${mensagem}`
      : mensagem;

    const resposta = await chamarGemini(promptComContexto, instrucao);
    res.json({ resposta });
  } catch (error) {
    console.error('Erro no Chat IA:', error.message);
    res.json({ resposta: `⚠️ Erro na IA: ${error.message}` });
  }
});

app.post('/api/ia/gerar-texto', async (req, res) => {
  try {
    const { aluno, pontosFortes, observacoes } = req.body || {};
    const prompt = `Escreva um parecer descritivo empático e alinhado à BNCC para o(a) aluno(a) do 5º ano: ${aluno || 'Estudante'}.\nPontos fortes: ${pontosFortes}\nAspectos a desenvolver: ${observacoes}\nGere 2 a 3 parágrafos fluidos, sem títulos.`;
    const texto = await chamarGemini(prompt);
    res.json({ texto });
  } catch (error) {
    console.error('Erro ao gerar texto:', error.message);
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

  const doc = new PDFDocument({ size: 'A4', margin: 40 });

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

  enviarPdfBuffer(res, doc, 'capas_portfolio.pdf');
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

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename=relatorio_${aluno.toLowerCase().replace(/\s+/g, '_')}.pdf`);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);

  const logoPath = path.join(__dirname, 'public', 'assets', 'images', 'logo-arlete-gois.png');
  const hasLogo = fs.existsSync(logoPath);

  let startY = 50;

  if (hasLogo) {
    doc.image(logoPath, 50, startY, { width: 55 });

    doc.font('Helvetica-Bold')
       .fontSize(13)
       .fillColor('#1a365d')
       .text(escola.toUpperCase(), 115, startY + 5);

    doc.font('Helvetica')
       .fontSize(9)
       .fillColor('#4a5568')
       .text(`INEP: ${inep}  |  CNPJ: ${cnpj}`, 115, startY + 23)
       .text(endereco, 115, startY + 36);

    startY += 65;
  } else {
    doc.font('Helvetica-Bold')
       .fontSize(14)
       .fillColor('#1a365d')
       .text(escola.toUpperCase(), { align: 'center' })
       .moveDown(0.2);

    doc.font('Helvetica')
       .fontSize(9)
       .fillColor('#4a5568')
       .text(`INEP: ${inep}  |  CNPJ: ${cnpj}`, { align: 'center' })
       .text(endereco, { align: 'center' });

    startY = doc.y + 10;
  }

  doc.moveTo(50, startY)
     .lineTo(545, startY)
     .lineWidth(1)
     .stroke('#cbd5e0');

  doc.font('Helvetica-Bold')
     .fontSize(11)
     .fillColor('#2b6cb0')
     .text(`RELATÓRIO INDIVIDUAL DO ALUNO | ${anoLetivo}`, 50, startY + 15, { align: 'center' });

  doc.font('Helvetica-Bold')
     .fontSize(10)
     .fillColor('#1a365d')
     .text(`ALUNO(A): ${aluno.toUpperCase()}  |  ${turma} — ${unidade.toUpperCase()}`, 50, doc.y + 5, { align: 'center' });

  doc.font('Helvetica')
     .fontSize(11)
     .fillColor('#2d3748')
     .text(texto, 50, doc.y + 20, {
       width: 495,
       align: 'justify',
       lineGap: 5
     });

  const footerY = 720;

  doc.moveTo(50, footerY - 15)
     .lineTo(545, footerY - 15)
     .lineWidth(0.5)
     .stroke('#e2e8f0');

  doc.font('Helvetica')
     .fontSize(10)
     .fillColor('#2d3748')
     .text(`Professora: ${professora}`, 50, footerY)
     .text(`Diretora: ${diretora}`, 50, footerY + 16)
     .text(`E-mail: ${email}`, 50, footerY + 32);

  doc.end();
});

app.post('/api/avaliacoes/gerar-pdf', (req, res) => {
  const {
    escola = 'ESCOLA MUNICIPAL ARLETE GÓIS',
    inep = '29059526',
    cnpj = '05.059.070/0001-39',
    endereco = 'Rua Euclides da Cunha, 181 | Cafarnaum-BA',
    professora = 'Eliene da Silva Santos',
    turma = '5º Ano',
    unidade = '1ª UNIDADE',
    materia = '',
    titulo = 'AVALIAÇÃO DE APRENDIZAGEM',
    data = '',
    texto = '',
    incluirGabarito = false
  } = req.body || {};

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const logoPath = path.join(__dirname, 'public', 'assets', 'images', 'logo-arlete-gois.png');

  let startY = 40;

  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 270, startY, { width: 52 });
      startY += 58;
    } catch (err) {
      console.warn('Logo ignorada:', err.message);
    }
  }

  doc.font('Helvetica-Bold').fontSize(13).fillColor('#1a365d')
     .text(escola.toUpperCase(), 50, startY, { width: 495, align: 'center' });

  doc.font('Helvetica').fontSize(9).fillColor('#4a5568')
     .text(`INEP: ${inep}  |  CNPJ: ${cnpj}`, 50, doc.y + 2, { width: 495, align: 'center' })
     .text(endereco, 50, doc.y + 2, { width: 495, align: 'center' });

  startY = doc.y + 10;

  doc.roundedRect(50, startY, 495, 66, 6).lineWidth(0.8).stroke('#cbd5e0');

  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1a365d')
     .text(`Professora: `, 62, startY + 10, { continued: true })
     .font('Helvetica').fillColor('#2d3748')
     .text(`${professora}    |    `, { continued: true })
     .font('Helvetica-Bold').fillColor('#1a365d')
     .text(`Turma: `, { continued: true })
     .font('Helvetica').fillColor('#2d3748')
     .text(`${turma}    |    ${unidade.toUpperCase()}`);

  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1a365d')
     .text(`Aluno(a): `, 62, startY + 28, { continued: true })
     .font('Helvetica').fillColor('#2d3748')
     .text(`_________________________________________________    `, { continued: true })
     .font('Helvetica-Bold').fillColor('#1a365d')
     .text(`Data: `, { continued: true })
     .font('Helvetica').fillColor('#2d3748')
     .text(data || '___/___/2026');

  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1a365d')
     .text(`Disciplina: `, 62, startY + 46, { continued: true })
     .font('Helvetica').fillColor('#2d3748')
     .text(`${materia || '______________________'}      `, { continued: true })
     .font('Helvetica-Bold').fillColor('#1a365d')
     .text(`Valor: `, { continued: true })
     .font('Helvetica').fillColor('#2d3748')
     .text(`________      `, { continued: true })
     .font('Helvetica-Bold').fillColor('#1a365d')
     .text(`Nota: `, { continued: true })
     .font('Helvetica').fillColor('#2d3748')
     .text(`________`);

  doc.font('Helvetica-Bold').fontSize(12).fillColor('#2b6cb0')
     .text(titulo.toUpperCase(), 50, startY + 80, { width: 495, align: 'center' });

  const regexGabarito = /(?:^|\n)\s*(?:#{1,3}\s*)?(?:\*{1,2})?GABARITO(?:\s+PARA\s+A\s+PROFESSORA)?(?:\*{1,2})?\s*:?\s*(?:\n|$)/i;
  const partes = texto.split(regexGabarito);
  const textoQuestoes = partes[0].trim();
  const textoGabarito = partes.length > 1 ? partes.slice(1).join('\n').trim() : '';

  doc.font('Helvetica').fontSize(11).fillColor('#1e293b')
     .text(textoQuestoes, 50, doc.y + 14, { width: 495, align: 'left', lineGap: 4 });

  if (incluirGabarito && textoGabarito) {
    if (doc.y > 620) doc.addPage();
    const divY = doc.y + 18;
    doc.moveTo(50, divY).lineTo(545, divY).lineWidth(1).stroke('#cbd5e0');

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#1a365d')
       .text('GABARITO PARA A PROFESSORA', 50, divY + 12, { width: 495, align: 'left' });

    doc.font('Helvetica').fontSize(10.5).fillColor('#334155')
       .text(textoGabarito, 50, doc.y + 8, { width: 495, align: 'left', lineGap: 4 });
  }

  const sufixo = incluirGabarito ? 'com_gabarito' : 'alunos';
  const nomeBase = (materia || 'avaliacao').toLowerCase().replace(/\s+/g, '_');
  enviarPdfBuffer(res, doc, `prova_${nomeBase}_${sufixo}.pdf`);
});

app.post('/api/avaliacoes/gerar-pdf', (req, res) => {
  const {
    escola = 'ESCOLA MUNICIPAL ARLETE GÓIS',
    inep = '29059526',
    cnpj = '05.059.070/0001-39',
    endereco = 'Rua Euclides da Cunha, 181 | Cafarnaum-BA',
    professora = 'Eliene da Silva Santos',
    turma = '5º Ano',
    unidade = '1ª UNIDADE',
    materia = '',
    titulo = 'AVALIAÇÃO DE APRENDIZAGEM',
    data = '',
    texto = '',
    incluirGabarito = false
  } = req.body || {};

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const logoPath = path.join(__dirname, 'public', 'assets', 'images', 'logo-arlete-gois.png');

  let startY = 40;

  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 270, startY, { width: 52 });
      startY += 58;
    } catch (err) {
      console.warn('Logo ignorada:', err.message);
    }
  }

  doc.font('Helvetica-Bold').fontSize(13).fillColor('#1a365d')
     .text(escola.toUpperCase(), 50, startY, { width: 495, align: 'center' });

  doc.font('Helvetica').fontSize(9).fillColor('#4a5568')
     .text(`INEP: ${inep}  |  CNPJ: ${cnpj}`, 50, doc.y + 2, { width: 495, align: 'center' })
     .text(endereco, 50, doc.y + 2, { width: 495, align: 'center' });

  startY = doc.y + 10;

  doc.roundedRect(50, startY, 495, 66, 6).lineWidth(0.8).stroke('#cbd5e0');

  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1a365d')
     .text(`Professora: `, 62, startY + 10, { continued: true })
     .font('Helvetica').fillColor('#2d3748')
     .text(`${professora}    |    `, { continued: true })
     .font('Helvetica-Bold').fillColor('#1a365d')
     .text(`Turma: `, { continued: true })
     .font('Helvetica').fillColor('#2d3748')
     .text(`${turma}    |    ${unidade.toUpperCase()}`);

  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1a365d')
     .text(`Aluno(a): `, 62, startY + 28, { continued: true })
     .font('Helvetica').fillColor('#2d3748')
     .text(`_________________________________________________    `, { continued: true })
     .font('Helvetica-Bold').fillColor('#1a365d')
     .text(`Data: `, { continued: true })
     .font('Helvetica').fillColor('#2d3748')
     .text(data || '___/___/2026');

  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1a365d')
     .text(`Disciplina: `, 62, startY + 46, { continued: true })
     .font('Helvetica').fillColor('#2d3748')
     .text(`${materia || '______________________'}      `, { continued: true })
     .font('Helvetica-Bold').fillColor('#1a365d')
     .text(`Valor: `, { continued: true })
     .font('Helvetica').fillColor('#2d3748')
     .text(`________      `, { continued: true })
     .font('Helvetica-Bold').fillColor('#1a365d')
     .text(`Nota: `, { continued: true })
     .font('Helvetica').fillColor('#2d3748')
     .text(`________`);

  doc.font('Helvetica-Bold').fontSize(12).fillColor('#2b6cb0')
     .text(titulo.toUpperCase(), 50, startY + 80, { width: 495, align: 'center' });

  const regexGabarito = /(?:^|\n)\s*(?:#{1,3}\s*)?(?:\*{1,2})?GABARITO(?:\s+PARA\s+A\s+PROFESSORA)?(?:\*{1,2})?\s*:?\s*(?:\n|$)/i;
  const partes = texto.split(regexGabarito);
  const textoQuestoes = partes[0].trim();
  const textoGabarito = partes.length > 1 ? partes.slice(1).join('\n').trim() : '';

  doc.font('Helvetica').fontSize(11).fillColor('#1e293b')
     .text(textoQuestoes, 50, doc.y + 14, { width: 495, align: 'left', lineGap: 4 });

  if (incluirGabarito && textoGabarito) {
    if (doc.y > 620) doc.addPage();
    const divY = doc.y + 18;
    doc.moveTo(50, divY).lineTo(545, divY).lineWidth(1).stroke('#cbd5e0');

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#1a365d')
       .text('GABARITO PARA A PROFESSORA', 50, divY + 12, { width: 495, align: 'left' });

    doc.font('Helvetica').fontSize(10.5).fillColor('#334155')
       .text(textoGabarito, 50, doc.y + 8, { width: 495, align: 'left', lineGap: 4 });
  }

  const sufixo = incluirGabarito ? 'com_gabarito' : 'alunos';
  const nomeBase = (materia || 'avaliacao').toLowerCase().replace(/\s+/g, '_');
  enviarPdfBuffer(res, doc, `prova_${nomeBase}_${sufixo}.pdf`);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor Didactis rodando na porta ${PORT}`);
});