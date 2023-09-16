const express = require('express');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const jwt_decode = require('jwt-decode');
dotenv.config();


const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
});

const User = sequelize.define('User', {
  firstname: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  lastname: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  role: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

sequelize.sync();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).send('Access Denied');

  try {
    const decoded = jwt_decode(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).send('Invalid Token');
  }
};

const users = [];

// Route to register a new user
app.post('/registerforuser', async (req, res) => {
    try {
      const { firstname, lastname, email, password } = req.body;
      const existingUser = users.find(user => user.email === email);

  if (existingUser) {
    return res.status(400).json({ error: 'อีเมลนี้มีอยู่แล้ว' });
  }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ firstname, lastname, email, password: hashedPassword, role: 'user' });
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Route to register a new manager
  app.post('/registerforphoto', async (req, res) => {
    try {
      const { firstname, lastname, email, password } = req.body;
      const existingUser = users.find(user => user.email === email);

  if (existingUser) {
    return res.status(400).json({ error: 'อีเมลนี้มีอยู่แล้ว' });
  }
      const hashedPassword = await bcrypt.hash(password, 10);
      const photo = await User.create({ firstname, lastname, email, password: hashedPassword, role: 'photo' });
      res.status(201).json(photo);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Route to register a new admin
  app.post('/registerforrent', async (req, res) => {
    try {
      const { firstname, lastname, email, password } = req.body;
      const existingUser = users.find(user => user.email === email);

  if (existingUser) {
    return res.status(400).json({ error: 'อีเมลนี้มีอยู่แล้ว' });
  }
      const hashedPassword = await bcrypt.hash(password, 10);
      const rent = await User.create({ firstname, lastname, email, password: hashedPassword, role: 'rent' });
      res.status(201).json(rent);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  

// Route for user login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user) return res.status(400).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) return res.status(400).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
    
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.SECRET_KEY, { expiresIn: '24h' });
    res.header('Authorization', token).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware to check if the user has a specific role
const checkUserRole = (role) => {
    return (req, res, next) => {
      if (req.user.role === role) {
        next(); // ผู้ใช้มีบทบาทตามที่ต้องการ
      } else {
        res.status(403).json({ error: 'Access denied. You do not have the required role.' });
      }
    };
  };
  
  // Protected route for photos
app.get('/photos', verifyToken, async (req, res) => {
  try {
    const photos = await User.findAll({ where: { role: 'photo' } });
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

  // Protected route for rent
app.get('/rent', verifyToken, async (req, res) => {
  try {
    const rent = await User.findAll({ where: { role: 'rent' } });
    res.json(rent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


  // Protected route for users
  app.get('/user/profile', verifyToken, checkUserRole('user'), async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      res.json({ id: user.id, firstname: user.firstname, lastname: user.lastname, email: user.email, role: user.role });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Protected route for managers
  app.get('/manager/profile', verifyToken, checkUserRole('manager'), async (req, res) => {
    try {
      const manager = await User.findByPk(req.user.id);
      if (!manager) return res.status(404).json({ error: 'Manager not found' });
      
      res.json({ id: manager.id, firstname: manager.firstname, lastname: manager.lastname, email: manager.email, role: manager.role });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Protected route for admins
  app.get('/admin/profile', verifyToken, checkUserRole('admin'), async (req, res) => {
    try {
      const admin = await User.findByPk(req.user.id);
      if (!admin) return res.status(404).json({ error: 'Admin not found' });
      
      res.json({ id: admin.id, firstname: admin.firstname, lastname: admin.lastname, email: admin.email, role: admin.role });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  

// Route to get user profile with role check
app.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ id: user.id, firstname: user.firstname, lastname: user.lastname, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
