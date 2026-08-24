// Seleciona os principais elementos usados nas interações da página
const botao = document.getElementById('botao-tema');
const body = document.body;
const formulario = document.getElementById('form-contato');
const mensagemFormulario = document.getElementById('mensagem-formulario')

// Recupera o último tema escolhido para manter a preferência ao atualizar a página
const temasalvo = localStorage.getItem('tema');
temaEscuro(temasalvo === 'escuro');

// Função que aplica o tema claro ou escuro e troca o ícone do botão
function temaEscuro(tipo) {
  if (tipo == true) {
    body.classList.add('escuro');
    botao.innerHTML = '<i class="fa-solid fa-sun"></i>';
  } else {
    body.classList.remove('escuro');
    botao.innerHTML = '<i class="fa-solid fa-moon"></i>';
  }
}

// Troca o tema quando o usuário clica no botão e salva a escolha no navegador
botao.addEventListener('click', (evento) => {
  evento.preventDefault();
  const isescuro = body.classList.toggle('escuro');
  temaEscuro(isescuro);
  localStorage.setItem('tema', isescuro ? 'escuro' : 'claro');
});

// Faz a rolagem suave até a seção escolhida no menu
const navLinks = document.querySelectorAll('#menu ul a.link');
navLinks.forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const headerHeight = document.querySelector('header').offsetHeight;
      const targetPosition = target.offsetTop - headerHeight - 20;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// Executa a validação quando o usuário tenta enviar o formulário
formulario.addEventListener('submit', function(evento) {
    // Impede o recarregamento da página durante a simulação do envio
    evento.preventDefault();

    // Obtém os valores digitados e remove espaços desnecessários
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const mensagem = document.getElementById('mensagem').value.trim();

    // Verifica o formato básico do endereço de e-mail
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Verifica se todos os campos foram preenchidos
    if (nome === '' || email === '' || mensagem === '') {
        mensagemFormulario.textContent =
            'Por favor, preencha todos os campos.';
        mensagemFormulario.className = 'erro';
        return;
    }

    // Caso o e-mail esteja fora do formato esperado, informa o usuário
    if (!emailValido.test(email)) {
        mensagemFormulario.textContent =
            'Por favor, informe um e-mail válido.';
        mensagemFormulario.className = 'erro';
        return;
    }

    // Simula o envio e exibe uma confirmação para o usuário
    mensagemFormulario.textContent =
        'Mensagem enviada com sucesso!';
    mensagemFormulario.className = 'sucesso';

    // Bloqueia os campos após o envio para evitar um segundo envio
    const camposFormulario = formulario.querySelectorAll(
        'input, textarea, button'
    );

    camposFormulario.forEach(function(campo) {
        campo.disabled = true;
    });
});