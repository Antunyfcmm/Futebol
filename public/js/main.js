let currentCoach = '';

let currentPlayer = '';

let isAdmin = false;

// Música de fundo

const backgroundMusic = document.getElementById('background-music');

const muteButton = document.getElementById('mute-button');

// Tocar música automaticamente ao carregar a página

window.addEventListener('load', () => {

    backgroundMusic.play();

});

// Função para alternar entre mutar e desmutar

function toggleMute() {

    if (backgroundMusic.muted) {

        backgroundMusic.muted = false;

        muteButton.textContent = '🔊';

        muteButton.classList.remove('muted');

    } else {

        backgroundMusic.muted = true;

        muteButton.textContent = '🔇';

        muteButton.classList.add('muted');

    }

}

// Função para fazer login

document.getElementById('login-form').addEventListener('submit', function(event) {

    event.preventDefault();

    const username = document.getElementById('username').value;

    const password = document.getElementById('password').value;

    fetch('/login', {

        method: 'POST',

        headers: {

            'Content-Type': 'application/json',

        },

        body: JSON.stringify({ username, password }),

    })

    .then(response => response.json())

    .then(data => {

        if (data.success) {

            currentCoach = username;

            isAdmin = data.isAdmin || false;

            document.getElementById('login-container').style.display = 'none';

            document.getElementById('market-container').style.display = 'block';

            document.getElementById('coach-name').textContent = data.coach;

            document.getElementById('balance').textContent = `Saldo: R$ ${data.balance}`;

            loadPlayers();

            loadNegotiating();

            loadMyTeam();

            // Mostra opções de admin se for admin

            if (isAdmin) {

                document.getElementById('admin-options').style.display = 'block';

            }

        } else {

            alert('Usuário ou senha incorretos');

        }

    });

});

// Função para alternar entre abas

function showTab(tabId) {

    // Esconde todas as abas

    document.querySelectorAll('.tab-content').forEach(tab => {

        tab.style.display = 'none';

    });

    // Mostra a aba selecionada

    document.getElementById(tabId).style.display = 'block';

    // Atualiza os botões ativos

    document.querySelectorAll('.tab-button').forEach(button => {

        button.classList.remove('active');

    });

    document.querySelector(`[onclick="showTab('${tabId}')"]`).classList.add('active');

}

// Função para carregar jogadores livres

function loadPlayers() {

    fetch('/players')

        .then(response => response.json())

        .then(players => {

            const playersList = document.getElementById('players-list');

            playersList.innerHTML = '';

            // Agrupa jogadores por posição

            const positions = {};

            players.forEach(player => {

                if (!positions[player.position]) {

                    positions[player.position] = [];

                }

                positions[player.position].push(player);

            });

            // Exibe os jogadores separados por posição

            for (const [position, playersInPosition] of Object.entries(positions)) {

                const positionHeader = document.createElement('h2');

                positionHeader.textContent = position;

                playersList.appendChild(positionHeader);

                playersInPosition.forEach(player => {

                    const playerCard = document.createElement('div');

                    playerCard.className = 'player-card';

                    playerCard.innerHTML = `

                        <img src="${player.photo}" alt="${player.name}">

                        <h3>${player.name}</h3>

                        <p>${player.club}</p>

                        <p>Posição: ${player.position}</p>

                        <p>Preço: R$ ${player.price}</p>

                        <button onclick="buyPlayer('${player.name}')">Contratar</button>

                    `;

                    playersList.appendChild(playerCard);

                });

            }

        });

}

// Função para carregar jogadores à venda

function loadNegotiating() {

    fetch('/negotiating')

        .then(response => response.json())

        .then(negotiating => {

            const negotiatingList = document.getElementById('negotiating-list');

            negotiatingList.innerHTML = '';

            negotiating.forEach(player => {

                const playerCard = document.createElement('div');

                playerCard.className = 'player-card';

                playerCard.innerHTML = `

                    <img src="${player.photo}" alt="${player.name}">

                    <h3>${player.name}</h3>

                    <p>${player.club}</p>

                    <p>Posição: ${player.position}</p>

                    <p>Preço: R$ ${player.price}</p>

                    <p>Vendedor: ${player.seller}</p>

                    <button onclick="openChat('${player.name}')">Negociar</button>

                `;

                negotiatingList.appendChild(playerCard);

            });

        });

}

// Função para carregar o "Meu Time"

function loadMyTeam() {

    fetch(`/my-team/${currentCoach}`)

        .then(response => response.json())

        .then(team => {

            const myTeamList = document.getElementById('my-team-list');

            myTeamList.innerHTML = '';

            team.forEach(player => {

                const playerCard = document.createElement('div');

                playerCard.className = 'player-card';

                playerCard.innerHTML = `

                    <img src="${player.photo}" alt="${player.name}">

                    <h3>${player.name}</h3>

                    <p>${player.club}</p>

                    <p>Posição: ${player.position}</p>

                    <button onclick="sellPlayer('${player.name}')">Vender</button>

                `;

                myTeamList.appendChild(playerCard);

            });

        });

}

// Função para contratar um jogador

function buyPlayer(playerName) {

    fetch('/buy', {

        method: 'POST',

        headers: {

            'Content-Type': 'application/json',

        },

        body: JSON.stringify({ playerName, coach: currentCoach }),

    })

    .then(response => response.json())

    .then(data => {

        if (data.success) {

            alert('Jogador contratado com sucesso!');

            document.getElementById('balance').textContent = `Saldo: R$ ${data.balance}`;

            loadPlayers(); // Atualiza a lista de jogadores livres

            loadMyTeam(); // Atualiza o "Meu Time"

        } else {

            alert('Erro ao contratar jogador. Verifique seu saldo.');

        }

    });

}

// Função para vender um jogador

function sellPlayer(playerName) {

    const price = prompt('Digite o valor de venda:');

    if (price) {

        fetch('/sell', {

            method: 'POST',

            headers: {

                'Content-Type': 'application/json',

            },

            body: JSON.stringify({ playerName, price, coach: currentCoach }),

        })

        .then(response => response.json())

        .then(data => {

            if (data.success) {

                alert('Jogador colocado à venda!');

                loadMyTeam(); // Atualiza o "Meu Time"

                loadNegotiating(); // Atualiza a lista de jogadores à venda

            } else {

                alert(data.message || 'Erro ao colocar jogador à venda.');

            }

        });

    }

}

// Função para abrir o chat de negociação

function openChat(playerName) {

    currentPlayer = playerName;

    document.getElementById('chat-container').style.display = 'block';

    loadChat();

}

// Função para carregar as mensagens e propostas do chat

function loadChat() {

    fetch('/negotiating')

        .then(response => response.json())

        .then(negotiating => {

            const negotiation = negotiating.find(n => n.name === currentPlayer);

            const chatMessages = document.getElementById('chat-messages');

            chatMessages.innerHTML = '';

            if (negotiation.chat) {

                negotiation.chat.forEach(message => {

                    const messageElement = document.createElement('div');

                    messageElement.textContent = `${message.sender}: ${message.message}`;

                    chatMessages.appendChild(messageElement);

                });

            }

            if (negotiation.proposals) {

                negotiation.proposals.forEach(proposal => {

                    const proposalElement = document.createElement('div');

                    proposalElement.textContent = `Proposta de ${proposal.coach}: R$ ${proposal.offer}`;

                    chatMessages.appendChild(proposalElement);

                });

            }

        });

}

// Função para enviar uma mensagem no chat

function sendMessage() {

    const message = document.getElementById('chat-input').value;

    if (message) {

        fetch('/chat', {

            method: 'POST',

            headers: {

                'Content-Type': 'application/json',

            },

            body: JSON.stringify({ playerName: currentPlayer, message, sender: currentCoach }),

        })

        .then(response => response.json())

        .then(data => {

            if (data.success) {

                document.getElementById('chat-input').value = '';

                loadChat();

            }

        });

    }

}

// Função para enviar uma proposta no chat

function sendProposal() {

    const offer = prompt('Digite o valor da sua proposta:');

    if (offer) {

        fetch('/propose', {

            method: 'POST',

            headers: {

                'Content-Type': 'application/json',

            },

            body: JSON.stringify({ playerName: currentPlayer, offer, coach: currentCoach }),

        })

        .then(response => response.json())

        .then(data => {

            if (data.success) {

                alert('Proposta enviada com sucesso!');

                loadChat();

            } else {

                alert(data.message || 'Erro ao enviar proposta.');

            }

        });

    }

}

// Função para adicionar dinheiro (admin)

function addMoney() {

    const coach = prompt('Digite o nome do técnico:');

    const amount = prompt('Digite o valor a ser adicionado:');

    if (coach && amount) {

        fetch('/admin/add-money', {

            method: 'POST',

            headers: {

                'Content-Type': 'application/json',

            },

            body: JSON.stringify({ coach, amount, adminUsername: currentCoach }),

        })

        .then(response => response.json())

        .then(data => {

            if (data.success) {

                alert(`Dinheiro adicionado com sucesso! Novo saldo: R$ ${data.balance}`);

            } else {

                alert(data.message || 'Erro ao adicionar dinheiro.');

            }

        });

    }

}

// Função para liberar jogador (admin)

function freePlayer() {

    const playerName = prompt('Digite o nome do jogador a ser liberado:');

    if (playerName) {

        fetch('/admin/free-player', {

            method: 'POST',

            headers: {

                'Content-Type': 'application/json',

            },

            body: JSON.stringify({ playerName, adminUsername: currentCoach }),

        })

        .then(response => response.json())

        .then(data => {

            if (data.success) {

                alert('Jogador liberado para contratação!');

                loadPlayers();

                loadNegotiating();

            } else {

                alert(data.message || 'Erro ao liberar jogador.');

            }

        });

    }

}