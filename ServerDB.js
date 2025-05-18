const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your_secret_key';

// Cấu hình CORS để cho phép kết nối từ React Native
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Kết nối tới MongoDB
mongoose.connect('mongodb+srv://fugdin321:phuoc123@my.yl0xnz2.mongodb.net/TIZ?retryWrites=true&w=majority&appName=My')
.then(() => {
    console.log('Successfully connected to MongoDB');
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Tạo Schema và Model cho User
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' }, // 👈 thêm dòng này
});


const User = mongoose.model('User', userSchema);

// Schema
const formulaSchema = new mongoose.Schema({
    title: String,
    description: String,
    latex: String, // ví dụ: a^2 + b^2 = c^2
    grade: Number, // Thêm trường grade (lớp)
});

const Formula = mongoose.model("Formula", formulaSchema);


// Middleware xác thực token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
    next();
};

// Route đăng ký
app.post('/api/register', async (req, res) => {
    try {
        console.log('Register request received:', req.body);
        
        // Kiểm tra các trường bắt buộc
        if (!req.body.username || !req.body.password || !req.body.email) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }

        // Kiểm tra username đã tồn tại
        const existingUsername = await User.findOne({ username: req.body.username });
        if (existingUsername) {
            return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
        }

        // Kiểm tra email đã tồn tại
        const existingEmail = await User.findOne({ email: req.body.email });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email đã tồn tại' });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Tạo user mới
        const user = new User({ 
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
            role: req.body.role || 'user',
        });
        
        await user.save();
        console.log('User registered successfully:', user.username);
        res.status(201).json({ message: 'Đăng ký thành công' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Lỗi đăng ký: ' + error.message });
    }
});

// Route đăng nhập
app.post('/api/login', async (req, res) => {
    try {
        console.log('Login request received:', req.body);
        console.log('Headers:', req.headers);
        
        if (!req.body.username || !req.body.password) {
            console.log('Missing username or password');
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const user = await User.findOne({ username: req.body.username });
        if (!user) {
            console.log('User not found:', req.body.username);
            return res.status(400).json({ message: 'User not found' });
        }
        
        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) {
            console.log('Invalid password for user:', req.body.username);
            return res.status(400).json({ message: 'Invalid password' });
        }
        
        const token = jwt.sign({ 
            userId: user._id,
            role: user.role 
        }, JWT_SECRET);
        console.log('Login successful for user:', user.username);
        res.json({ token, user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            bio: user.bio,
            avatar: user.avatar,
            coverPhoto: user.coverPhoto
        }});
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error during login' });
    }
});

// Routes
app.get("/formulas", async (req, res) => {
  const formulas = await Formula.find();
  res.json(formulas);
});

app.get("/formulas/search", async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    // Search in title, description and latex fields
    const formulas = await Formula.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { latex: { $regex: query, $options: 'i' } }
      ]
    });

    res.json(formulas);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error searching formulas' });
  }
});

app.get("/formulas/grade/:grade", async (req, res) => {
  const grade = parseInt(req.params.grade);
  const formulas = await Formula.find({ grade });
  res.json(formulas);
});

app.post("/formulas", authenticateToken, isAdmin, async (req, res) => {
    const { title, description, latex, grade } = req.body;
    if (!title || !description || !latex || !grade) {
        return res.status(400).json({ message: "Thiếu thông tin công thức" });
    }
    const formula = new Formula({ title, description, latex, grade });
    await formula.save();
    res.status(201).json(formula);
});

app.put("/formulas/:id", authenticateToken, isAdmin, async (req, res) => {
    const { title, description, latex, grade } = req.body;
    const updated = await Formula.findByIdAndUpdate(
        req.params.id,
        { title, description, latex, grade },
        { new: true }
    );
    res.json(updated);
});

app.delete("/formulas/:id", authenticateToken, isAdmin, async (req, res) => {
    await Formula.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});


// Khởi động server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
    console.log('Server is accessible from any IP address');
});
