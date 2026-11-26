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

    const prompt = `Você é uma professora do 5º ano do Ensino Fundamental da Escola Municipal Arlete Góis.
    Elabore ${quantidade || 5} questões de ${materia || 'Ciências'} sobre "${tema}" no formato "${tipo}".

    Siga exatamente o estilo pedagógico das avaliações da escola:
    - Quando fizer sentido, abra com um texto curto e claro de apoio ("Leia o texto e responda:").
    - Varie entre múltipla escolha (alternativas a, b, c, d), Verdadeiro ou Falso ("Marque V ou F:" com "(   )" antes de cada afirmativa), Relacione as colunas (com "(   )") e questões abertas/cálculos.
    - Em questões de cálculo ou resposta escrita, coloque na linha seguinte exatamente a marcação [CAIXA_RESPOSTA] para que o PDF desenhe o quadro de resposta do aluno.
    - Não coloque as respostas junto das perguntas.
    - Ao final de tudo, escreva exatamente uma linha com --- GABARITO --- e liste as respostas numeradas.

    Responda apenas com o conteúdo da avaliação e o gabarito, sem introduções ou saudações.`;

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
    unidade = "1º TRIMESTRE",
    anoLetivo = "2026",
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
    unidade = "1º TRIMESTRE",
    anoLetivo = "2026",
    texto = ""
  } = req.body || {};

  const doc = new PDFDocument({
    size: 'A4',
    bufferPages: true,
    margins: { top: 125, bottom: 110, left: 50, right: 50 }
  });

  const logoPath = path.join(__dirname, 'public', 'assets', 'images', 'logo-arlete-gois.png');
  const hasLogo = fs.existsSync(logoPath);

  doc.font('Helvetica-Bold')
     .fontSize(11)
     .fillColor('#2b6cb0')
     .text(`RELATÓRIO INDIVIDUAL DO ALUNO | ${anoLetivo}`, 50, 125, { align: 'center', width: 495 });

  doc.font('Helvetica-Bold')
     .fontSize(10)
     .fillColor('#1a365d')
     .text(`ALUNO(A): ${aluno.toUpperCase()}  |  ${turma} — ${unidade.toUpperCase()}`, 50, doc.y + 4, { align: 'center', width: 495 });

  doc.font('Helvetica')
     .fontSize(11)
     .fillColor('#2d3748')
     .text(texto, 50, doc.y + 20, {
       width: 495,
       align: 'justify',
       lineGap: 5
     });

  if (doc.y > 700) {
    doc.addPage();
  }

  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    const startY = 38;

    if (hasLogo) {
      doc.image(logoPath, 130, startY, { fit: [52, 54] });

      doc.font('Helvetica-Bold')
         .fontSize(13)
         .fillColor('#1a365d')
         .text(escola.toUpperCase(), 192, startY + 7, { align: 'center', width: 270, lineBreak: false });

      doc.font('Helvetica')
         .fontSize(9)
         .fillColor('#4a5568')
         .text(`INEP: ${inep}  |  CNPJ: ${cnpj}`, 192, startY + 25, { align: 'center', width: 270, lineBreak: false })
         .text(endereco, 192, startY + 38, { align: 'center', width: 270, lineBreak: false });
    } else {
      doc.font('Helvetica-Bold')
         .fontSize(14)
         .fillColor('#1a365d')
         .text(escola.toUpperCase(), 50, startY + 5, { align: 'center', width: 495, lineBreak: false });

      doc.font('Helvetica')
         .fontSize(9)
         .fillColor('#4a5568')
         .text(`INEP: ${inep}  |  CNPJ: ${cnpj}`, 50, startY + 24, { align: 'center', width: 495, lineBreak: false })
         .text(endereco, 50, startY + 37, { align: 'center', width: 495, lineBreak: false });
    }

    doc.moveTo(50, startY + 66)
       .lineTo(545, startY + 66)
       .lineWidth(1)
       .stroke('#cbd5e0');
  }

  doc.switchToPage(range.count - 1);
  doc.page.margins.bottom = 0;
  const footerY = 762;

  doc.moveTo(50, footerY - 34)
     .lineTo(545, footerY - 34)
     .lineWidth(0.6)
     .stroke('#cbd5e0');

  doc.moveTo(65, footerY - 5).lineTo(255, footerY - 5).lineWidth(0.7).stroke('#64748b');
  doc.moveTo(340, footerY - 5).lineTo(530, footerY - 5).lineWidth(0.7).stroke('#64748b');

  doc.font('Helvetica-Bold')
     .fontSize(9.5)
     .fillColor('#1e293b')
     .text(professora, 50, footerY, { width: 220, align: 'center', lineBreak: false })
     .text(diretora, 325, footerY, { width: 220, align: 'center', lineBreak: false });

  doc.font('Helvetica')
     .fontSize(8.5)
     .fillColor('#64748b')
     .text('Professora Regente', 50, footerY + 12, { width: 220, align: 'center', lineBreak: false })
     .text('Diretora Escolar', 325, footerY + 12, { width: 220, align: 'center', lineBreak: false });

  doc.font('Helvetica')
     .fontSize(9)
     .fillColor('#475569')
     .text(`E-mail institucional: ${email}`, 50, footerY + 34, { width: 495, align: 'center', lineBreak: false });

  enviarPdfBuffer(res, doc, `relatorio_${aluno.toLowerCase().replace(/\s+/g, '_')}.pdf`);
});

app.post('/api/avaliacoes/gerar-pdf', (req, res) => {
  try {
    const {
      materia = '',
      titulo = 'AVALIAÇÃO DE APRENDIZAGEM',
      unidade = '1º TRIMESTRE',
      data = '',
      texto = '',
      incluirGabarito = false
    } = req.body || {};

    const partes = texto.split(/---\s*GABARITO\s*---/i);
    const corpoQuestoes = (partes[0] || '').trim();
    const corpoGabarito = (partes[1] || '').trim();

    const doc = new PDFDocument({ size: 'A4', margin: 45 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    });
    doc.on('error', (err) => {
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    });

    const logoPath = path.join(__dirname, 'public', 'assets', 'images', 'logo-arlete-gois.png');
    const topY = 25;

    if (require('fs').existsSync(logoPath)) {
      doc.image(logoPath, 152, topY, { fit: [46, 48] });
    }

    doc.font('Helvetica-Bold').fontSize(13).fillColor('#0f172a')
      .text('ESCOLA MUNICIPAL ARLETE GÓIS', 208, topY + 8, { align: 'center', width: 235 });
    doc.font('Helvetica').fontSize(9).fillColor('#334155')
      .text('INEP. 29059526 | CNPJ. 05.059.070/0001-39', 208, topY + 25, { align: 'center', width: 235 });

    const boxY = topY + 58;
    doc.roundedRect(45, boxY, 505, 52, 4).lineWidth(0.8).strokeColor('#64748b').stroke();

    doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a')
      .text('Aluno(a): ____________________________________________________________________', 55, boxY + 10);

    const dataFormatada = data.trim() ? data.trim() : '____/____/2026';
    doc.text(`Profª: Eliene da Silva Santos          Turma: 5º Ano          Data: ${dataFormatada}`, 55, boxY + 30);

    const tituloLimpo = titulo.toUpperCase().includes(unidade.toUpperCase())
      ? titulo.toUpperCase()
      : `${titulo.toUpperCase()} – ${unidade.toUpperCase()}`;

    doc.y = boxY + 66;
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a')
      .text(tituloLimpo, 45, doc.y, { align: 'center', width: 505 });

    if (incluirGabarito) {
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#0284c7')
        .text('(VERSÃO DA PROFESSORA – COM GABARITO)', { align: 'center', width: 505 });
    }

    doc.moveDown(1);

    const linhas = corpoQuestoes.split('\n');
    for (const linhaRaw of linhas) {
      const linha = linhaRaw.trim();

      if (!linha) {
        doc.moveDown(0.4);
        continue;
      }

      if (linha === '[CAIXA_RESPOSTA]') {
        if (doc.y > 700) doc.addPage();
        doc.rect(45, doc.y + 2, 505, 65).lineWidth(0.7).strokeColor('#94a3b8').stroke();
        doc.y += 74;
        continue;
      }

      const ehEnunciado = /^(\d+[\.\-\)]|Questões:|Leia o texto|Consulte o texto|Marque V|Relacione)/i.test(linha);
      doc.font(ehEnunciado ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(10.5)
        .fillColor('#1e293b')
        .text(linha, 45, doc.y, { width: 505, align: 'left', lineGap: 2 });
    }

    if (incluirGabarito && corpoGabarito) {
      doc.moveDown(1.2);
      if (doc.y > 680) doc.addPage();

      doc.moveTo(45, doc.y).lineTo(550, doc.y).lineWidth(1).strokeColor('#0284c7').stroke();
      doc.moveDown(0.6);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#0284c7')
        .text('GABARITO (PROFESSORA)', 45, doc.y, { width: 505 });
      doc.moveDown(0.4);
      doc.font('Helvetica').fontSize(10).fillColor('#0f172a')
        .text(corpoGabarito, 45, doc.y, { width: 505, lineGap: 3 });
    }

    doc.end();
  } catch (error) {
    console.error('Erro ao montar PDF da avaliação:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro ao gerar PDF da avaliação.' });
    }
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor Didactis rodando na porta ${PORT}`);
});