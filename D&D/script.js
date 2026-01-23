const cards = document.querySelectorAll('.card-js')

const modal = document.getElementById('modal')
const modalTitle = document.getElementById('modal-title')
const modalText = document.getElementById('modal-text')
const modalImg = document.getElementById('modal-img')
const closeModal = document.getElementById('close-modal')

const classes = {
    barbaro: {
        nome: 'Bárbaro',
        descricao: 'Um guerreiro feroz que usa força bruta e fúria em combate.',
        imagem: "imagens/barbaro.png"
    },
    bardo: {
        nome: 'Bardo',
        descricao: 'Um artista versátil que inspira aliados com música e magia.',
        imagem: "imagens/bardo.png"
    },
    warlock: {
        nome: 'Bruxo',
        descricao: 'Bruxo (warlock) é um conjurador que ganha poder mágico ao fazer um pacto com uma entidade poderosa',
        imagem: "imagens/warlock.png"
    },
    mago: {
        nome: 'Mago',
        descricao: 'O mago é um estudioso da magia arcana que usa inteligência e grimórios para lançar feitiços poderosos, controlando o campo de batalha com conhecimento e preparo.',
        imagem: 'imagens/mago.png'
    },
    paladino: {
        nome: 'Paladino',
        descricao:'O paladino é um guerreiro sagrado que luta guiado por um juramento. Com fé e disciplina, ele combina combate, magia divina e proteção, defendendo seus aliados e punindo o mal com justiça',
        imagem: 'imagens/paladino.png'
    },
    ladino: {
        nome: 'Ladino',
        descricao: 'O ladino é ágil e furtivo, especialista em ataques precisos, armadilhas e infiltração. Com astúcia e rapidez, ele vence antes mesmo de ser notado.',
        imagem: 'imagens/rogue.png'
    },
    druida: {
        nome: 'Druida',
        descricao: 'O druida é um guardião da natureza, capaz de usar magia natural e se transformar em animais. Em harmonia com o mundo selvagem, ele protege o equilíbrio entre a civilização e a natureza.',
        imagem: 'imagens/druida.png'
    },
    artifice: {
        nome: 'Artífice',
        descricao: 'O artífice é um inventor mágico que combina tecnologia e magia para criar engenhocas, armas e itens encantados, apoiando o grupo com inteligência e criatividade.',
        imagem: 'imagens/artifice.png'
    },
    clerigo: {
        nome: 'Clérigo',
        descricao: 'O clérigo é um devoto que canaliza magia divina para curar aliados, proteger o grupo e enfrentar o mal em nome de sua divindade.',
        imagem: 'imagens/clerigo.png'
    },
    feiticeiro: {
        nome: 'Feiticeiro(Sorcerer)',
        descricao: 'O feiticeiro nasce com magia no sangue, lançando feitiços por puro talento e força interior. Seu poder é instintivo, caótico e devastador.',
        imagem: 'imagens/feiticeiro.png'
    },
    ranger: {
        nome: 'Ranger',
        descricao: 'O ranger é um caçador experiente e protetor das fronteiras selvagens, especialista em rastreamento, combate à distância e sobrevivência na natureza.',
        imagem: 'imagens/ranger.png'
    },
}



// hover (zoom)
cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.classList.add('zoomed')
    })

    card.addEventListener('mouseleave', () => {
        card.classList.remove('zoomed')
    })

    // click (abrir modal)
    card.addEventListener('click', () => {
        const id = card.id.replace('card-', '')

        if (classes[id]) {
            modalTitle.textContent = classes[id].nome
            modalTitle.style.fontFamily = 'MedievalSharp, cursive'
            modalText.textContent = classes[id].descricao
            modalImg.src = classes[id].imagem
            modal.classList.add('active')
        }
    })
})

closeModal.addEventListener('click', () => {
    modal.classList.remove('active')
})

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active')
    }
})


