const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Web3 = require('web3');
const WebSocket = require('ws');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const contractABI = require('./contractABI.json');

const contractAddress = '0xeEf9B2E3da20Ca00f5d662E9a3712EC3dbB0Ccc0';
const mongoURI = "mongodb+srv://2254810192:ghostriver003@election-president-syst.wqzai.mongodb.net/?retryWrites=true&w=majority&appName=election-president-system";
const SECRET_KEY = "mySecretKey"; // Thay bằng key bảo mật thực tế

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

const voterSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    citizenId: { type: String, required: true, unique: true },
    address: { type: String, required: true, unique: true },
    isRegistered: { type: Boolean, default: false },
    hasVoted: { type: Boolean, default: false },
});
const VoterModel = mongoose.model('Voter', voterSchema);

const app = express();
app.use(cors());
app.use(bodyParser.json());

const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://127.0.0.1:8545'));
const contract = new web3.eth.Contract(contractABI, contractAddress);

// ✅ API ĐĂNG NHẬP
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: '❌ Missing email or password' });
    }

    try {
        const user = await VoterModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: '❌ Email not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: '❌ Incorrect password' });
        }

        // Tạo token JWT
        const token = jwt.sign({ id: user._id, address: user.address }, SECRET_KEY, { expiresIn: '1h' });

        res.json({ message: '✅ Login successful', token });
    } catch (error) {
        console.error("❌ Login error:", error);
        res.status(500).json({ error: '❌ Server error' });
    }
});

// ✅ Middleware kiểm tra token JWT
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(403).json({ error: '❌ Unauthorized' });
    }
    
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: '❌ Invalid token' });
    }
};

// ✅ API ĐĂNG KÝ (KHÔNG THAY ĐỔI)
app.post('/register', async (req, res) => {
    const { email, password, citizenId, address } = req.body;

    if (!email || !password || !citizenId || !address) {
        return res.status(400).json({ error: '❌ Missing required fields' });
    }

    try {
        if (!web3.utils.isAddress(address)) {
            return res.status(400).json({ error: '❌ Invalid Ethereum address' });
        }

        const existingVoter = await VoterModel.findOne({ $or: [{ email }, { citizenId }, { address }] });
        if (existingVoter) {
            return res.status(400).json({ error: '❌ Voter already registered' });
        }

        const isRegistered = await contract.methods.voters(address).call();
        if (isRegistered.isRegistered) {
            return res.status(400).json({ error: '❌ Voter already registered on blockchain' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await contract.methods.registerVoter().send({ from: address, gas: 5000000 });
        await new VoterModel({ email, password: hashedPassword, citizenId, address, isRegistered: true }).save();

        res.json({ message: '✅ Voter registered successfully' });
    } catch (error) {
        console.error("❌ Registration error:", error);
        res.status(500).json({ error: '❌ Registration failed' });
    }
});

// ✅ API BẦU CỬ (BẢO VỆ BẰNG JWT)
app.post('/vote', authMiddleware, async (req, res) => {
    const { candidateName } = req.body;
    const address = req.user.address; // Lấy từ JWT

    try {
        if (!candidateName) {
            return res.status(400).json({ error: '❌ Missing candidate name' });
        }

        const voter = await VoterModel.findOne({ address });
        if (!voter || !voter.isRegistered) {
            return res.status(400).json({ error: '❌ Voter is not registered' });
        }

        if (voter.hasVoted) {
            return res.status(400).json({ error: '❌ Voter has already voted' });
        }

        const candidates = await contract.methods.getCandidateList().call();
        if (!candidates.includes(candidateName)) {
            return res.status(400).json({ error: '❌ Candidate does not exist' });
        }

        await contract.methods.castVote(candidateName).send({ from: address, gas: 5000000 });
        voter.hasVoted = true;
        await voter.save();

        res.json({ message: '✅ Vote cast successfully' });
    } catch (error) {
        console.error("❌ Voting error:", error);
        res.status(500).json({ error: '❌ Voting failed' });
    }
});

// ✅ API DANH SÁCH ỨNG VIÊN
app.get('/candidates', async (req, res) => {
    try {
        const candidates = await contract.methods.getCandidateList().call();
        res.json(candidates);
    } catch (error) {
        console.error("❌ Error fetching candidates:", error);
        res.status(500).json({ error: '❌ Failed to fetch candidates' });
    }
});
// ✅ Middleware kiểm tra token JWT
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(403).json({ error: '❌ Unauthorized' });
    }
    
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: '❌ Invalid token' });
    }
};

// ✅ API THÊM ỨNG VIÊN (CHỈ DÀNH CHO ADMIN)
app.post('/addCandidate', authMiddleware, async (req, res) => {
    const { candidateName } = req.body;
    const address = req.user.address; 

    try {
        if (!candidateName) {
            return res.status(400).json({ error: '❌ Missing candidate name' });
        }

        await contract.methods.addCandidate(candidateName).send({ from: address, gas: 5000000 });
        res.json({ message: `✅ Candidate ${candidateName} added successfully` });
    } catch (error) {
        console.error("❌ Error adding candidate:", error);
        res.status(500).json({ error: '❌ Failed to add candidate' });
    }
});

// ✅ API XÓA ỨNG VIÊN (CHỈ DÀNH CHO ADMIN)
app.delete('/removeCandidate', authMiddleware, async (req, res) => {
    const { candidateName } = req.body;
    const address = req.user.address;

    try {
        if (!candidateName) {
            return res.status(400).json({ error: '❌ Missing candidate name' });
        }

        await contract.methods.removeCandidate(candidateName).send({ from: address, gas: 5000000 });
        res.json({ message: `✅ Candidate ${candidateName} removed successfully` });
    } catch (error) {
        console.error("❌ Error removing candidate:", error);
        res.status(500).json({ error: '❌ Failed to remove candidate' });
    }
});

// ✅ API LẤY DANH SÁCH CỬ TRI (CHỈ DÀNH CHO ADMIN)
app.get('/voters', authMiddleware, async (req, res) => {
    try {
        const voters = await VoterModel.find({}, 'email citizenId address isRegistered hasVoted');
        res.json(voters);
    } catch (error) {
        console.error("❌ Error fetching voters:", error);
        res.status(500).json({ error: '❌ Failed to fetch voters' });
    }
});

// ✅ API LẤY KẾT QUẢ BẦU CỬ
app.get('/results', async (req, res) => {
    try {
        const results = await contract.methods.getElectionResults().call();
        res.json(results);
    } catch (error) {
        console.error("❌ Error fetching results:", error);
        res.status(500).json({ error: '❌ Failed to fetch election results' });
    }
});

// ✅ API DANH SÁCH ỨNG VIÊN
app.get('/candidates', async (req, res) => {
    try {
        const candidates = await contract.methods.getCandidateList().call();
        res.json(candidates);
    } catch (error) {
        console.error("❌ Error fetching candidates:", error);
        res.status(500).json({ error: '❌ Failed to fetch candidates' });
    }
});

// ✅ SERVER & WEBSOCKET
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

const wss = new WebSocket.Server({ port: 3001 });

wss.on('connection', (ws) => {
    console.log('🔌 Client connected to WebSocket');
    ws.on('message', (message) => {
        console.log(`📩 Received: ${message}`);
    });
    ws.send('🔔 Connected to WebSocket Server');
});

contract.events.allEvents()
    .on('data', event => {
        console.log('🔔 Blockchain Event:', event.event, event.returnValues);
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ event: event.event, data: event.returnValues }));
            }
        });
    })
    .on('error', error => {
        console.error('❌ Event error:', error);
    });

app.get('/', (req, res) => {
    res.json({
        endpoints: {
            register: { method: 'POST', path: '/register' },
            login: { method: 'POST', path: '/login' },
            vote: { method: 'POST', path: '/vote' },
            candidates: { method: 'GET', path: '/candidates' },
            addCandidate: { method: 'POST', path: '/addCandidate' },
            removeCandidate: { method: 'DELETE', path: '/removeCandidate' },
            voters: { method: 'GET', path: '/voters' },
            results: { method: 'GET', path: '/results' },
        },
    });
});
