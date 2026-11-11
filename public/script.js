const menuItems = document.querySelectorAll('.menu-item');
const views = document.querySelectorAll('.view');

function navegarPara(viewId) {
  views.forEach(view => view.classList.remove('active'));
  menuItems.forEach(item => item.classList.remove('active'));

  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.add('active');

  const targetMenuItem = document.querySelector(`[data-target="${viewId}"]`);
  if (targetMenuItem) targetMenuItem.classList.add('active');
}

menuItems.forEach(button => {
  button.addEventListener('click', () => {
    const targetView = button.getAttribute('data-target');
    navegarPara(targetView);
  });
});

document.getElementById('capaForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn = document.getElementById('btnGerar');
  btn.innerText = 'Gerando PDF... aguarde';
  btn.disabled = true;

  const alunosTexto = document.getElementById('alunos').value;
  const alunosArray = alunosTexto
    .split('\n')
    .map(nome => nome.trim())
    .filter(nome => nome.length > 0);

  const dadosFormulario = {
    escola: document.getElementById('escola').value,
    professora: document.getElementById('professora').value,
    turma: document.getElementById('turma').value,
    unidade: document.getElementById('unidade').value,
    anoLetivo: document.getElementById('anoLetivo').value,
    alunos: alunosArray
  };

  try {
    const response = await fetch('/api/capas/gerar-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosFormulario)
    });

    if (!response.ok) throw new Error('Erro ao gerar o PDF');

    const blob = await response.blob();
    const pdfUrl = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = 'capas_portfolio.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();

  } catch (error) {
    alert('Não foi possível conectar com o servidor backend.');
    console.error(error);
  } finally {
    btn.innerText = '🚀 Gerar Capas em PDF';
    btn.disabled = false;
  }
});

document.getElementById('relatorioForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn = document.getElementById('btnGerarRelatorio');
  btn.innerText = 'Gerando Relatório... aguarde';
  btn.disabled = true;

  const dadosFormulario = {
    escola: document.getElementById('relatorioEscola').value,
    professora: document.getElementById('relatorioProfessora').value,
    aluno: document.getElementById('relatorioAluno').value,
    turma: document.getElementById('relatorioTurma').value,
    unidade: document.getElementById('relatorioUnidade').value,
    texto: document.getElementById('relatorioTexto').value
  };

  try {
    const response = await fetch('/api/relatorios/gerar-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosFormulario)
    });

    if (!response.ok) throw new Error('Erro na resposta do servidor');

    const blob = await response.blob();
    const pdfUrl = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `relatorio_${dadosFormulario.aluno.toLowerCase().replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

  } catch (error) {
    alert('Rota do backend ainda não configurada. Aguardando modelo de layout!');
    console.error(error);
  } finally {
    btn.innerText = '📄 Gerar Relatório em PDF';
    btn.disabled = false;
  }
});

function alternarModoIA(modo) {
  const tabChat = document.getElementById('modo-ia-chat');
  const tabForm = document.getElementById('modo-ia-form');
  const btns = document.querySelectorAll('.ia-tab-btn');

  btns.forEach(btn => btn.classList.remove('active'));

  if (modo === 'chat') {
    tabChat.style.display = 'block';
    tabForm.style.display = 'none';
    btns[0].classList.add('active');
  } else {
    tabChat.style.display = 'none';
    tabForm.style.display = 'block';
    btns[1].classList.add('active');
  }
}

const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const btnSendChat = document.getElementById('btnSendChat');

function adicionarMensagem(texto, origem) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add(origem === 'user' ? 'msg-user' : 'msg-ai');
  msgDiv.textContent = texto;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function enviarMensagemParaIA(texto) {
  adicionarMensagem(texto, 'user');

  btnSendChat.disabled = true;
  btnSendChat.innerText = 'Pensando...';

  try {
    const response = await fetch('/api/ia/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensagem: texto })
    });

    if (!response.ok) throw new Error('Erro na resposta da IA');

    const data = await response.json();
    adicionarMensagem(data.resposta, 'ai');
  } catch (error) {
    adicionarMensagem('Desculpe, não consegui responder agora. Verifique a chave da API no servidor.', 'ai');
    console.error(error);
  } finally {
    btnSendChat.disabled = false;
    btnSendChat.innerText = 'Enviar 🚀';
  }
}

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const mensagem = chatInput.value.trim();
  if (!mensagem) return;

  chatInput.value = '';
  enviarMensagemParaIA(mensagem);
});

document.querySelectorAll('.btn-shortcut').forEach(button => {
  button.addEventListener('click', () => {
    const promptPronto = button.getAttribute('data-prompt');
    enviarMensagemParaIA(promptPronto);
  });
});

document.getElementById('iaForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnGerarIA');
  btn.innerText = 'Gerando parecer...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/ia/gerar-texto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aluno: document.getElementById('iaAluno').value,
        pontosFortes: document.getElementById('iaPontosFortes').value,
        observacoes: document.getElementById('iaObservacoes').value
      })
    });
    const data = await res.json();
    document.getElementById('iaTextoGerado').value = data.texto;
    document.getElementById('iaResultadoBox').style.display = 'block';
  } catch (err) {
    alert('Erro ao gerar parecer com a IA.');
  } finally {
    btn.innerText = '✨ Gerar Parecer com IA';
    btn.disabled = false;
  }
});

document.getElementById('btnCopiarIA').addEventListener('click', () => {
  const text = document.getElementById('iaTextoGerado');
  text.select();
  navigator.clipboard.writeText(text.value);
  alert('Parecer copiado!');
});