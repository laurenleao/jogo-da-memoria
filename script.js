const urlParams = new URLSearchParams(window.location.search);
let initialTema = urlParams.get('tema');

const allThemes = ['alfabeto', 'numeros', 'cores', 'animais'];
let playedThemes = new Set(JSON.parse(sessionStorage.getItem('playedThemes')) || []);
let summaryOfFoundElements = JSON.parse(sessionStorage.getItem('summaryOfFoundElements')) || {};


let nomeAluno = sessionStorage.getItem('nomeAluno') || '';
let idadeAluno = parseInt(sessionStorage.getItem('idadeAluno')) || 0;

let numPairs = 0;
let erros = 0;
let firstCard = null;
let secondCard = null;
let lock = false;
let matches = 0;
let foundElements = new Set();
let currentTema = '';

// Objeto para armazenar as mensagens personalizadas por tema
const temaFrases = {
    'alfabeto': 'Descubra os pares das letras do alfabeto!',
    'numeros': 'Encontre os pares dos números iguais!',
    'cores': 'Combine as cores correspondentes!',
    'animais': 'Descubra os pares dos animais!'
};

const messageDisplay = document.getElementById('message');
const matchesDisplay = document.getElementById('matches-counter'); 
const errorsDisplay = document.getElementById('errors-counter');   

const popupNome = document.getElementById('popup-nome');
const popupFim = document.getElementById('popup-fim');
const btnProximoTema = document.getElementById('btnProximoTemaLink'); 
const popupFinalGeral = document.getElementById('popup-final-geral');

// REMOVIDO: Referência ao overlay de comemoração
// const celebrationOverlay = document.getElementById('celebration-overlay');

// --- FUNÇÃO ATUALIZADA PARA ATUALIZAR AS ESTRELAS (AGORA POR TEMA CONCLUÍDO) ---
function updateStarRating() { // O parâmetro 'erros' foi removido
    const starImage = document.getElementById('starRatingImage');
    // A contagem de estrelas agora é baseada no número de temas já jogados
    let starCount = playedThemes.size; 

    // Garante que a imagem exista antes de tentar mudar o src
    if (starImage) {
        // Ajuste o caminho da imagem se você tiver uma subpasta 'estrelas' dentro de 'img'
        // Por exemplo: starImage.src = `img/estrelas/${starCount}-estrela.png`;
        starImage.src = `img/${starCount}-estrela.png`; 
        starImage.alt = `${starCount} estrelas`;
        // Ajustar o tamanho da imagem, se desejar (opcional, pode ser feito via CSS também)
        starImage.style.width = '300px'; // Ajuste o tamanho aqui
        starImage.style.height = 'auto'; // Mantém a proporção
        starImage.style.marginTop = '15px'; // Espaçamento
    }
}
// --- FIM DA NOVA FUNÇÃO ---


function iniciarJogo() {
    if (!nomeAluno || !idadeAluno) {
        popupNome.classList.add("active");
        if (nomeAluno) document.getElementById('nomeAluno').value = nomeAluno;
        if (idadeAluno) document.getElementById('idadeAluno').value = idadeAluno;
    } else {
        popupNome.classList.remove("active");
        if (playedThemes.size === allThemes.length) {
            showOverallCompletionPopup();
        } else {
            setupGameForTheme();
        }
    }
}

function setupGameForTheme() {
    if (idadeAluno <= 5) {
        numPairs = 3;
    } else if (idadeAluno <= 8) {
        numPairs = 6;
    } else {
        numPairs = 12;
    }

    // NOVO: Lógica para exibir/esconder o contador de erros
    if (numPairs === 12) {
        errorsDisplay.style.display = 'block'; // Mostra o contador de erros
    } else {
        errorsDisplay.style.display = 'none'; // Esconde o contador de erros
    }

    if (initialTema && !playedThemes.has(initialTema)) {
        currentTema = initialTema;
        playedThemes.add(currentTema);
    } else {
        const availableThemes = allThemes.filter(t => !playedThemes.has(t));
        if (availableThemes.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableThemes.length);
            currentTema = availableThemes[randomIndex];
            playedThemes.add(currentTema);
        } else {
            showOverallCompletionPopup();
            return; 
        }
    }
    
    sessionStorage.setItem('playedThemes', JSON.stringify(Array.from(playedThemes)));

    iniciarCartas();
    const frasePersonalizada = temaFrases[currentTema] || `Encontre os pares no tema "${currentTema}"!`; // Se o tema não tiver frase, usa a padrão
    messageDisplay.innerText = `Olá, ${nomeAluno}! ${frasePersonalizada}`;
    updateCounters(); 
}

function confirmarInicioJogo() {
    const nomeInput = document.getElementById("nomeAluno").value.trim();
    const idadeInput = parseInt(document.getElementById("idadeAluno").value);

    if (nomeInput && idadeInput > 0 && idadeInput <= 120) {
        nomeAluno = nomeInput;
        idadeAluno = idadeInput;
        sessionStorage.setItem('nomeAluno', nomeAluno);
        sessionStorage.setItem('idadeAluno', idadeAluno);
        
        popupNome.classList.remove("active");
        setupGameForTheme();
    } else {
        alert("Por favor, digite seu nome e uma idade válida (entre 1 e 120 anos) para começar!");
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const temas = {
    alfabeto: [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(l => l.toLowerCase()),
    numeros: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    cores: ['azul', 'amarelo', 'verde', 'vermelho', 'laranja', 'roxo', 'rosa', 'rosa-claro', 'marrom', 'preto', 'branco', 'cinza'],
    animais: ['baleia', 'tartaruga', 'leao', 'cachorro', 'girafa', 'macaco', 'urso', 'axalote', 'elefante', 'coelho', 'vaca', 'pato', 'sapo', 'cavalo', 'passaro']
};

function iniciarCartas() {
    const elementosDoTema = [...(temas[currentTema] || temas['alfabeto'])];
    
    if (elementosDoTema.length < numPairs) {
        console.warn(`Atenção: O tema "${currentTema}" tem apenas ${elementosDoTema.length} elementos, que suporta no máximo ${elementosDoTema.length} pares. O jogo será iniciado com ${elementosDoTema.length} pares.`);
        numPairs = elementosDoTema.length;
    }

    const selectedElements = shuffle(elementosDoTema).slice(0, numPairs);
    const cards = shuffle([...selectedElements, ...selectedElements]);

    const gameBoard = document.getElementById('gameBoard');
    gameBoard.innerHTML = '';
    erros = 0;
    matches = 0;
    foundElements.clear();
    updateCounters(); 

    if (numPairs === 3) {
        gameBoard.style.gridTemplateColumns = 'repeat(3, 1fr)';
    } else if (numPairs === 6) {
        gameBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
    } else if (numPairs === 12) {
        gameBoard.style.gridTemplateColumns = 'repeat(6, 1fr)';
    } else {
        if (cards.length <= 14) {
             gameBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
        } else if (cards.length <= 20) {
             gameBoard.style.gridTemplateColumns = 'repeat(5, 1fr)';
        } else {
             gameBoard.style.gridTemplateColumns = 'repeat(auto-fit, minmax(100px, 1fr))';
        }
    }

    cards.forEach((el) => {
        const card = document.createElement('div');
        card.classList.add('card');

        const inner = document.createElement('div');
        inner.classList.add('card-inner');

        const front = document.createElement('div');
        front.classList.add('card-front');
        const imgFront = document.createElement('img');
        imgFront.src = 'img/logo-cartas.png';
        imgFront.alt = 'Cover';
        front.appendChild(imgFront);

        const back = document.createElement('div');
        back.classList.add('card-back');
        const imgBack = document.createElement('img');
        
        if (currentTema === 'animais') {
            imgBack.src = `img/animais/${el}.png`;
        } else if (currentTema === 'numeros') {
            imgBack.src = `img/numeros/${el}.png`;
        } else if (currentTema === 'cores') {
            imgBack.src = `img/cores/${el}.png`;
        } else if (currentTema === 'alfabeto') {
            imgBack.src = `img/alfabeto/${el}.png`;
        } else {
            imgBack.src = `img/cartas/${currentTema}/${el}.png`;
        }
        
        imgBack.alt = el;
        back.appendChild(imgBack);

        inner.appendChild(front);
        inner.appendChild(back);
        card.appendChild(inner);

        card.dataset.value = el;

        card.addEventListener('click', () => {
            if (lock || card.classList.contains('revealed') || card.classList.contains('matched')) return;

            card.classList.add('revealed');

            if (!firstCard) {
                firstCard = card;
            } else {
                secondCard = card;
                lock = true;

                if (firstCard.dataset.value === secondCard.dataset.value) {
                    firstCard.classList.add('matched');
                    secondCard.classList.add('matched');
                    matches++;
                    foundElements.add(firstCard.dataset.value);
                    updateCounters(); 

                    if (matches === numPairs) {
                        const elementosString = Array.from(foundElements).join(', ');
                        let fraseElementos = '';
                        if (currentTema === 'cores') {
                            fraseElementos = `Nessa fase você viu as cores: ${elementosString}.`;
                        } else if (currentTema === 'numeros') {
                            fraseElementos = `Nessa fase você viu os números: ${elementosString}.`;
                        } else if (currentTema === 'alfabeto') {
                            fraseElementos = `Nessa fase você viu as letras: ${elementosString}.`;
                        } else if (currentTema === 'animais') {
                            fraseElementos = `Nessa fase você viu os animais: ${elementosString}.`;
                        }
                        
                        summaryOfFoundElements[currentTema] = elementosString;
                        sessionStorage.setItem('summaryOfFoundElements', JSON.stringify(summaryOfFoundElements));

                        // REMOVIDO: startCelebration();

                        // Atraso de 3 segundos antes de mostrar o pop-up final
                        setTimeout(() => {
                                let mensagemDeProgresso;
                                if (playedThemes.size < allThemes.length) {
                                     // Se ainda houver temas para jogar
                                    mensagemDeProgresso = `Que legal! Você completou mais um tema!`;
                                } else {
                                     // Se todos os temas foram completados
                                    mensagemDeProgresso = `Parabéns! Você completou TODOS os temas!`;
                                }
                                mostrarMensagemFinal(`${nomeAluno}, ${mensagemDeProgresso}`, erros, fraseElementos);
                            }, 3000); 
                    }
                    resetSelection();
                } else {
                    erros++;
                    updateCounters(); 

                    setTimeout(() => {
                        firstCard.classList.remove('revealed');
                        secondCard.classList.remove('revealed');
                        resetSelection();
                    }, 1000);

                    // NOVO: Condição para Game Over por erros, apenas para 6 e 12 pares
                    if (numPairs === 6 && erros >= 8) {
                           mostrarMensagemFinal(`${nomeAluno}, você atingiu o limite de erros (${erros}). 😢 Tente novamente!`);
                    } else if (numPairs === 12 && erros >= 10) {
                           mostrarMensagemFinal(`${nomeAluno}, você atingiu o limite de erros (${erros}). 😢 Tente novamente!`);
                    }
                }
            }
        });

        gameBoard.appendChild(card);
    });

    function resetSelection() {
        firstCard = null;
        secondCard = null;
        lock = false;
    }
}

function updateCounters() {
    matchesDisplay.innerText = `Pares Encontrados: ${matches} de ${numPairs}`;
    errorsDisplay.innerText = `Erros: ${erros}`;
}

// REMOVIDO: Função para iniciar a comemoração
// function startCelebration() {
//     celebrationOverlay.classList.add('active');
//     setTimeout(() => {
//         celebrationOverlay.classList.remove('active');
//     }, 5000); 
// }


function mostrarMensagemFinal(mensagem, totalErros, elementosEncontrados = '') {
    const popup = document.getElementById("popup-fim");
    document.getElementById("mensagemFinal").innerText = mensagem;
    
    // --- CHAMADA DA FUNÇÃO DE ESTRELAS ---
    updateStarRating(); // CHAMADA AGORA SEM O ARGUMENTO 'totalErros'
    // --- FIM DA CHAMADA ---
    
    const errosFinalElement = document.getElementById("errosFinal");
    if (numPairs === 12) { 
        errosFinalElement.innerText = `Total de erros: ${totalErros}`;
        errosFinalElement.style.display = 'block'; 
    } else {
        errosFinalElement.style.display = 'none'; 
    }
    
    let elementosParagrafo = document.getElementById("elementosEncontrados");
    if (!elementosParagrafo) {
        elementosParagrafo = document.createElement('p');
        elementosParagrafo.id = "elementosEncontrados";
        const errosFinalP = document.getElementById("errosFinal");
        errosFinalP.parentNode.insertBefore(elementosParagrafo, errosFinalP.nextSibling);
    }
    elementosParagrafo.innerText = elementosEncontrados;
    elementosParagrafo.style.fontSize = '1em';
    elementosParagrafo.style.color = '#3b5998';
    elementosParagrafo.style.marginTop = '10px';

    const availableThemes = allThemes.filter(t => !playedThemes.has(t));
    if (availableThemes.length > 0) {
        btnProximoTema.style.display = 'inline-block'; 
        popup.classList.add("active");
    } else {
        popup.classList.remove("active");
        // REMOVIDO: startCelebration(); 
        showOverallCompletionPopup();
    }
}

function recarregarJogo() {
    popupFim.classList.remove("active");
    iniciarCartas();
    const frasePersonalizada = temaFrases[currentTema] || `Encontre os pares no tema "${currentTema}"!`;
    messageDisplay.innerText = `Olá, ${nomeAluno}! ${frasePersonalizada}`;
}

function proximoTema() {
    popupFim.classList.remove("active"); 
    
    const availableThemes = allThemes.filter(t => !playedThemes.has(t));
    if (availableThemes.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableThemes.length);
        currentTema = availableThemes[randomIndex];
        playedThemes.add(currentTema);
        sessionStorage.setItem('playedThemes', JSON.stringify(Array.from(playedThemes)));

        iniciarCartas();
        // ATUALIZADA A MENSAGEM DO PROXIMO TEMA PARA USAR AS FRASES PERSONALIZADAS
        const frasePersonalizada = temaFrases[currentTema] || `Encontre os pares no tema "${currentTema}"!`;
        messageDisplay.innerText = `Olá, ${nomeAluno}! ${frasePersonalizada}`;
    } else {
        // REMOVIDO: startCelebration(); 
        showOverallCompletionPopup();
    }
}

function showOverallCompletionPopup() {
    document.getElementById('nomeAlunoFinalGeral').innerText = nomeAluno;
    const resumoContainer = document.getElementById('resumoTemasVistos');
    resumoContainer.innerHTML = ''; 

    allThemes.forEach(temaName => {
        if (summaryOfFoundElements[temaName]) {
            const p = document.createElement('p');
            let label = '';
            if (temaName === 'cores') {
                label = 'Cores';
            } else if (temaName === 'numeros') {
                label = 'Números';
            } else if (temaName === 'alfabeto') {
                label = 'Letras';
            } else if (temaName === 'animais') {
                label = 'Animais';
            }
            p.innerHTML = `<strong>${label}:</strong> ${summaryOfFoundElements[temaName]}.`;
            resumoContainer.appendChild(p);
        }
    });

    popupFim.classList.remove("active");
    popupFinalGeral.classList.add("active");
}

function voltarParaTemas() {
    sessionStorage.clear();
    window.location.href = `index.html`;
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#popup-nome .action-button-link').onclick = confirmarInicioJogo; 
    iniciarJogo();
});

function resetGameCycle() {
    playedThemes.clear();
    sessionStorage.removeItem('playedThemes');
    summaryOfFoundElements = {};
    sessionStorage.removeItem('summaryOfFoundElements');
}