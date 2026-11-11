const express = require('express');
const PDFDocument = require('pdfkit');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Rota de teste para a raiz do servidor (Health Check)
app.get('/', (req, res) => {
  res.send('API Didactis está online e funcionando!');
});

// Rota POST principal que recebe os dados do formulário e gera as capas
app.post('/api/capas/gerar-pdf', (req, res) => {
  // Extrai os dados enviados na requisição ou aplica valores padrão de fallback
  const {
    escola = "ESCOLA MUNICIPAL ARLETE GÓIS",
    professora = "Eliene da Silva Santos",
    turma = "5º Ano",
    unidade = "1ª UNIDADE",
    anoLetivo = "2027",
    alunos = ["Ana Souza", "Bruno Lima", "Carla Dias", "Daniel Oliveira"]
  } = req.body || {};

  // Configura os cabeçalhos para o navegador reconhecer o fluxo de PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename=capas_portfolio.pdf');

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(res);

  alunos.forEach((nomeAluno, index) => {
    if (index > 0) doc.addPage();

    // 1. Moldura externa dupla com cantos arredondados
    doc.roundedRect(25, 25, 545, 792, 10).lineWidth(2).stroke('#2e5b88');
    doc.roundedRect(30, 30, 535, 782, 8).lineWidth(0.8).stroke('#6ba3d6');

    // 2. Cabeçalho institucional
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

    // 3. Título principal do documento
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

    // 4. Espaço delimitado para fotos ou ilustrações
    doc.roundedRect(137, 240, 320, 260, 12)
       .dash(4, { space: 6 })
       .lineWidth(1.5)
       .stroke('#cbd5e0');
    doc.undash();

    doc.font('Helvetica-Oblique')
       .fontSize(10)
       .fillColor('#a0aec0')
       .text('[ Espaço para Foto ou Desenho do Aluno ]', 137, 365, { width: 320, align: 'center' });

    // 5. Cartão de destaque para o nome do estudante
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