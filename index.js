require('dotenv').config();

const express = require('express');
const PDFDocument = require('pdfkit');
const cors = require('cors');
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

app.post('/api/ia/gerar-texto', async (req, res) => {
  try {
    const { aluno, pontosFortes, observacoes } = req.body || {};
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Você é um assistente pedagógico especialista no 5º ano do Ensino Fundamental.
Escreva um parecer descritivo empático, construtivo e alinhado à BNCC para o/a estudante: ${aluno || 'Estudante'}.

Pontos fortes e avanços observados: ${pontosFortes}
Aspectos a desenvolver / observações: ${observacoes}

Gere um texto fluido em 2 a 3 parágrafos bem articulados, sem títulos genéricos.`;

    const result = await model.generateContent(prompt);
    res.json({ texto: result.response.text() });
  } catch (error) {
    console.error('Erro no Gerador de Parecer:', error);
    res.status(500).json({ error: 'Erro ao gerar parecer.' });
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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor Didactis rodando na porta ${PORT}`);
});