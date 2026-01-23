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


