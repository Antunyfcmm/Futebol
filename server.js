const express = require('express');

const fs = require('fs');

const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static('public'));

// Carrega os dados iniciais

let users = JSON.parse(fs.readFileSync('users.json', 'utf8'));

let players = JSON.parse(fs.readFileSync('players.json', 'utf8'));

let negotiating = JSON.parse(fs.readFileSync('negotiating.json', 'utf8'));

// Rota para login

app.post('/login', (req, res) => {

    const { username, password } = req.body;

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {

        res.json({ success: true, coach: user.username, balance: user.balance, isAdmin: user.isAdmin || false });

    } else {

        res.json({ success: false });

    }

});

// Rota para obter os jogadores livres

app.get('/players', (req, res) => {

    res.json(players);

});

// Rota para obter os jogadores à venda

app.get('/negotiating', (req, res) => {

    res.json(negotiating);

});

// Rota para obter o "Meu Time" do técnico

app.get('/my-team/:coach', (req, res) => {

    const { coach } = req.params;

    const user = users.find(u => u.username === coach);

    if (user && user.team) {

        res.json(user.team);

    } else {

        res.json([]);

    }

});

// Rota para contratar um jogador

app.post('/buy', (req, res) => {

    const { playerName, coach } = req.body;

    const player = players.find(p => p.name === playerName);

    const user = users.find(u => u.username === coach);

    if (player && user && user.balance >= player.price) {

        user.balance -= player.price;

        // Adiciona o jogador ao "Meu Time" do técnico

        if (!user.team) user.team = [];

        user.team.push(player);

        // Remove o jogador da lista de livres

        players = players.filter(p => p.name !== playerName);

        fs.writeFileSync('users.json', JSON.stringify(users, null, 2));

        fs.writeFileSync('players.json', JSON.stringify(players, null, 2));

        res.json({ success: true, balance: user.balance });

    } else {

        res.json({ success: false });

    }

});

// Rota para vender um jogador

app.post('/sell', (req, res) => {

    const { playerName, price, coach } = req.body;

    const user = users.find(u => u.username === coach);

    if (user && user.team) {

        const player = user.team.find(p => p.name === playerName);

        if (player) {

            // Adiciona o jogador à lista de negociação

            negotiating.push({ ...player, price, seller: coach });

            // Remove o jogador do "Meu Time" do técnico

            user.team = user.team.filter(p => p.name !== playerName);

            fs.writeFileSync('users.json', JSON.stringify(users, null, 2));

            fs.writeFileSync('negotiating.json', JSON.stringify(negotiating, null, 2));

            res.json({ success: true });

        } else {

            res.json({ success: false, message: 'Jogador não encontrado no seu time.' });

        }

    } else {

        res.json({ success: false, message: 'Time não encontrado.' });

    }

});

// Rota para enviar mensagens no chat

app.post('/chat', (req, res) => {

    const { playerName, message, sender } = req.body;

    const negotiation = negotiating.find(n => n.name === playerName);

    if (negotiation) {

        if (!negotiation.chat) negotiation.chat = [];

        negotiation.chat.push({ sender, message });

        fs.writeFileSync('negotiating.json', JSON.stringify(negotiating, null, 2));

        res.json({ success: true });

    } else {

        res.json({ success: false });

    }

});

// Rota para adicionar dinheiro a um técnico (apenas admin)

app.post('/admin/add-money', (req, res) => {

    const { coach, amount, adminUsername } = req.body;

    const admin = users.find(u => u.username === adminUsername && u.isAdmin);

    if (admin) {

        const user = users.find(u => u.username === coach);

        if (user) {

            user.balance += parseFloat(amount);

            fs.writeFileSync('users.json', JSON.stringify(users, null, 2));

            res.json({ success: true, balance: user.balance });

        } else {

            res.json({ success: false, message: 'Técnico não encontrado.' });

        }

    } else {

        res.json({ success: false, message: 'Acesso negado. Somente admin pode adicionar dinheiro.' });

    }

});

// Rota para liberar um jogador para contratação (apenas admin)

app.post('/admin/free-player', (req, res) => {

    const { playerName, adminUsername } = req.body;

    const admin = users.find(u => u.username === adminUsername && u.isAdmin);

    if (admin) {

        const player = negotiating.find(n => n.name === playerName);

        if (player) {

            // Remove o jogador da lista de negociação

            negotiating = negotiating.filter(n => n.name !== playerName);

            // Adiciona o jogador de volta à lista de livres

            players.push(player);

            fs.writeFileSync('players.json', JSON.stringify(players, null, 2));

            fs.writeFileSync('negotiating.json', JSON.stringify(negotiating, null, 2));

            res.json({ success: true });

        } else {

            res.json({ success: false, message: 'Jogador não encontrado na lista de negociação.' });

        }

    } else {

        res.json({ success: false, message: 'Acesso negado. Somente admin pode liberar jogadores.' });

    }

});

app.listen(port, () => {

    console.log(`Servidor rodando em http://localhost:${port}`);

});