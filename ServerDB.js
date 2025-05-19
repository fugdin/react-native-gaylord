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
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    bio: {
        type: String,
        default: 'Chưa có mô tả.'
    },
    avatar: String,
    coverPhoto: String,
    joinDate: {
        type: Date,
        default: Date.now
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

// Schema cho Formula
const formulaSchema = new mongoose.Schema({
    title: String,
    description: String,
    latex: String, // ví dụ: a^2 + b^2 = c^2
    grade: Number, // Thêm trường grade (lớp)
});

const Formula = mongoose.model("Formula", formulaSchema);

// Schema cho FavoriteFormula
const favoriteFormulaSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    formulaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Formula',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Tạo index kết hợp để đảm bảo mỗi công thức chỉ được yêu thích 1 lần bởi mỗi người dùng
favoriteFormulaSchema.index({ userId: 1, formulaId: 1 }, { unique: true });

const FavoriteFormula = mongoose.model("FavoriteFormula", favoriteFormulaSchema);

// Middleware xác thực token
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        console.log('Auth header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'undefined');
        
        if (!authHeader) {
            console.log('No Authorization header');
            return res.status(401).json({ message: 'Access denied. No Authorization header.' });
        }
        
        const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
        
        if (!token) {
            console.log('No token found in Authorization header');
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }
        
        console.log('Token to verify (first 20 chars):', token.substring(0, 20) + '...');
        
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                console.error('JWT verification error:', err);
                return res.status(403).json({ message: 'Invalid token: ' + err.message });
            }
            
            console.log('Decoded token:', JSON.stringify(decoded));
            
            if (!decoded.userId) {
                console.error('Token missing userId');
                return res.status(403).json({ message: 'Invalid token: missing userId' });
            }
            
            req.user = {
                id: decoded.userId,
                role: decoded.role
            };
            
            console.log('User info set in request:', req.user);
            next();
        });
    } catch (error) {
        console.error('Error in authenticateToken middleware:', error);
        res.status(500).json({ message: 'Server error in authentication' });
    }
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

        // Tạo user mới với các trường mở rộng
        const user = new User({ 
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
            role: req.body.role || 'user',
            bio: 'Chưa có mô tả.',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(req.body.username)}&background=random&color=fff&size=200`,
            coverPhoto: 'https://images.unsplash.com/photo-1633613286991-611fe299c4be?q=80&w=2070&auto=format&fit=crop',
            joinDate: new Date(),
            lastActive: new Date()
        });
        
        await user.save();
        console.log('User registered successfully:', user.username);
        
        // Tạo token để đăng nhập tự động sau khi đăng ký
        const token = jwt.sign({ 
            userId: user._id.toString(),
            role: user.role 
        }, JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({ 
            message: 'Đăng ký thành công', 
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                bio: user.bio,
                avatar: user.avatar,
                coverPhoto: user.coverPhoto,
                favoriteFormulas: 0,
                joinDate: user.joinDate.toISOString().split('T')[0],
                lastActive: 'Hôm nay'
            }
        });
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
        
        // Cập nhật lastActive
        user.lastActive = new Date();
        await user.save();
        
        // Đếm số lượng công thức yêu thích
        const favoriteCount = await FavoriteFormula.countDocuments({ userId: user._id });
        console.log('User favorite formulas count:', favoriteCount);

        // Tạo token với đúng userId
        const token = jwt.sign({ 
            userId: user._id.toString(), // Đảm bảo userId là string
            role: user.role 
        }, JWT_SECRET, { expiresIn: '7d' }); // Token hết hạn sau 7 ngày
        
        console.log('Login successful for user:', user.username);
        console.log('Generated token (first 20 chars):', token.substring(0, 20) + '...');
        
        res.json({ 
            token, 
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                bio: user.bio,
                avatar: user.avatar,
                coverPhoto: user.coverPhoto,
                favoriteFormulas: favoriteCount,
                joinDate: user.joinDate.toISOString().split('T')[0],
                lastActive: 'Hôm nay'
            }
        });
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

// POST /users/change-password
app.post('/users/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    console.log('Change password - User ID:', userId);
    
    // Tìm user trong database
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found for ID:', userId);
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    // Kiểm tra mật khẩu hiện tại
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      console.log('Current password incorrect for user:', user.username);
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }
    
    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Cập nhật mật khẩu
    user.password = hashedPassword;
    await user.save();
    console.log('Password changed successfully for user:', user.username);
    
    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /users/favorites - Lấy danh sách công thức yêu thích
app.get('/users/favorites', authenticateToken, async (req, res) => {
  try {
    console.log('Get favorites endpoint called');
    const userId = req.user.id;
    
    console.log('Get favorites - User ID:', userId);
    
    // Kiểm tra userId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log('Invalid userId format:', userId);
      return res.status(400).json({ message: 'Invalid userId format' });
    }
    
    // Tìm tất cả công thức yêu thích của user và populate thông tin công thức
    const favorites = await FavoriteFormula.find({ userId })
      .populate('formulaId')
      .sort({ createdAt: -1 }); // Sắp xếp theo thời gian thêm vào, mới nhất lên đầu
    
    console.log(`Found ${favorites.length} favorite formulas for user`);
    
    // Trả về danh sách công thức (không phải FavoriteFormula objects)
    const formulas = favorites.map(fav => fav.formulaId);
    res.json(formulas);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /users/check-favorite - Kiểm tra công thức có trong yêu thích
app.post('/users/check-favorite', authenticateToken, async (req, res) => {
  try {
    console.log('Check favorite endpoint called');
    const { formulaId } = req.body;
    const userId = req.user.id;
    
    console.log('Check favorite - User ID:', userId);
    console.log('Check favorite - Formula ID:', formulaId);
    
    if (!formulaId) {
      console.log('Missing formulaId in request');
      return res.status(400).json({ message: 'Missing formulaId', isFavorite: false });
    }
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log('Invalid userId format:', userId);
      return res.status(400).json({ message: 'Invalid userId format', isFavorite: false });
    }
    
    if (!mongoose.Types.ObjectId.isValid(formulaId)) {
      console.log('Invalid formulaId format:', formulaId);
      return res.status(400).json({ message: 'Invalid formulaId format', isFavorite: false });
    }
    
    // Tìm bản ghi yêu thích với userId và formulaId
    const favorite = await FavoriteFormula.findOne({ userId, formulaId });
    const isFavorite = !!favorite; // Chuyển kết quả thành boolean
    
    console.log('Is favorite:', isFavorite);
    res.json({ isFavorite });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({ message: 'Lỗi server', isFavorite: false });
  }
});

// POST /users/add-favorite - Thêm công thức vào yêu thích
app.post('/users/add-favorite', authenticateToken, async (req, res) => {
  try {
    console.log('Add favorite endpoint called');
    const { formulaId } = req.body;
    const userId = req.user.id;
    
    console.log('Add favorite - User ID:', userId);
    console.log('Add favorite - Formula ID:', formulaId);
    
    if (!formulaId) {
      console.log('Missing formulaId in request');
      return res.status(400).json({ message: 'Missing formulaId' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log('Invalid userId format:', userId);
      return res.status(400).json({ message: 'Invalid userId format' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(formulaId)) {
      console.log('Invalid formulaId format:', formulaId);
      return res.status(400).json({ message: 'Invalid formulaId format' });
    }
    
    // Kiểm tra công thức tồn tại
    const formula = await Formula.findById(formulaId);
    if (!formula) {
      console.log('Formula not found for ID:', formulaId);
      return res.status(404).json({ message: 'Không tìm thấy công thức' });
    }
    
    // Kiểm tra người dùng tồn tại
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found for ID:', userId);
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    // Kiểm tra xem đã yêu thích chưa
    const existingFavorite = await FavoriteFormula.findOne({ userId, formulaId });
    
    if (existingFavorite) {
      console.log('Formula already in favorites');
      return res.json({ message: 'Công thức đã có trong yêu thích' });
    }
    
    // Tạo bản ghi yêu thích mới
    const newFavorite = new FavoriteFormula({
      userId,
      formulaId,
      createdAt: new Date()
    });
    
    await newFavorite.save();
    console.log('Formula added to favorites');
    
    // Đếm tổng số yêu thích của người dùng
    const count = await FavoriteFormula.countDocuments({ userId });
    
    res.json({ 
      message: 'Đã thêm vào yêu thích', 
      favoriteCount: count
    });
  } catch (error) {
    // Xử lý lỗi trùng lặp (nếu người dùng thêm cùng lúc)
    if (error.code === 11000) {
      console.log('Duplicate key error (already favorite)');
      return res.json({ message: 'Công thức đã có trong yêu thích' });
    }
    
    console.error('Error adding favorite:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /users/remove-favorite - Xóa công thức khỏi yêu thích
app.post('/users/remove-favorite', authenticateToken, async (req, res) => {
  try {
    console.log('Remove favorite endpoint called');
    const { formulaId } = req.body;
    const userId = req.user.id;
    
    console.log('Remove favorite - User ID:', userId);
    console.log('Remove favorite - Formula ID:', formulaId);
    
    if (!formulaId) {
      console.log('Missing formulaId in request');
      return res.status(400).json({ message: 'Missing formulaId' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log('Invalid userId format:', userId);
      return res.status(400).json({ message: 'Invalid userId format' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(formulaId)) {
      console.log('Invalid formulaId format:', formulaId);
      return res.status(400).json({ message: 'Invalid formulaId format' });
    }
    
    // Kiểm tra người dùng tồn tại
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found for ID:', userId);
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    // Tìm và xóa bản ghi yêu thích
    const result = await FavoriteFormula.findOneAndDelete({ userId, formulaId });
    
    if (!result) {
      console.log('Formula not in favorites');
      return res.json({ message: 'Công thức không có trong danh sách yêu thích' });
    }
    
    console.log('Formula removed from favorites');
    
    // Đếm tổng số yêu thích của người dùng
    const count = await FavoriteFormula.countDocuments({ userId });
    
    res.json({ 
      message: 'Đã xóa khỏi yêu thích', 
      favoriteCount: count 
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ message: 'Không thể xóa khỏi danh sách yêu thích. Vui lòng thử lại sau.' });
  }
});

// Khởi động server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
    console.log('Server is accessible from any IP address');
});
