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

// โมเดลผู้ใช้
const User = sequelize.define(
  "users",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    firstname: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    lastname: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    role: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

// โมเดลโปรไฟล์ช่างภาพ
const PhotographerProfile = sequelize.define(
  "photographer_profile",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: Sequelize.INTEGER,
      foreignKey: {
        references: {
          table: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      allowNull: false,
    },
    birthday: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    address: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    id_card: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    image_id_card: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    image_profile: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    province: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    job_type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

const reviews = sequelize.define("reviews", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  content: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  rating: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: Sequelize.INTEGER,
    foreignKey: {
      references: {
        table: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    allowNull: false,
  },
  equipment_rental_profile_id: {
    type: Sequelize.INTEGER,
    foreignKey: {
      references: {
        table: "photography_equipment_rental_profile",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    allowNull: true, 
  },
  photographer_profile_id: {
    type: Sequelize.INTEGER,
    foreignKey: {
      references: {
        table: "photographer_profile",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    allowNull: true, 
  },
});

// โมเดลโปรไฟล์ผู้ให้เช่าอุปกรณ์ถ่ายภาพ
const PhotographyEquipmentRentalProfile = sequelize.define(
  "photography_equipment_rental_profile",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: Sequelize.INTEGER,
      foreignKey: {
        references: {
          table: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      allowNull: false,
    },
    birthday: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    address: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    id_card: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    image_id_card: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    image_profile: {
      type: Sequelize.STRING,
      allowNull: false,
    }
  },
  {
    timestamps: true,
  }
);

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
  
  // Route to register a new rent 
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

// Protected route for getting a specific photo by ID
app.get('/photographer/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const photographer = await User.findOne({ where: { id , role : 'photo' } });

    if (!photographer) {
      return res.status(404).json({ error: 'ไม่พบช่างภาพ' });
    }

    res.json(photographer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get('/rent/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rent = await User.findOne({ where: { id , role : 'rent' } });

    if (!rent) {
      return res.status(404).json({ error: 'ไม่พบผู้ให้เช่าอุปกรณ์' });
    }

    res.json(rent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


  // Protected route for users
//   app.get('/user/profile', verifyToken, checkUserRole('user'), async (req, res) => {
//     try {
//       const user = await User.findByPk(req.user.id);
//       if (!user) return res.status(404).json({ error: 'User not found' });
      
//       res.json({ id: user.id, firstname: user.firstname, lastname: user.lastname, email: user.email, role: user.role });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   });
  
//   // Protected route for photographers
//   app.get('/photo/profile', verifyToken, checkUserRole('photo'), async (req, res) => {
//     try {
//       const photo = await User.findByPk(req.user.id);
//       if (!photo) return res.status(404).json({ error: 'Manager not found' });
      
//       res.json({ id: photo.id, firstname: photo.firstname, lastname: photo.lastname, email: photo.email, role: photo.role });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   });
  
//   // Protected route for admins
//   app.get('/admin/profile', verifyToken, checkUserRole('admin'), async (req, res) => {
//     try {
//       const admin = await User.findByPk(req.user.id);
//       if (!admin) return res.status(404).json({ error: 'Admin not found' });
      
//       res.json({ id: admin.id, firstname: admin.firstname, lastname: admin.lastname, email: admin.email, role: admin.role });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   });
  

// // Route to get user profile with role check
// app.get('/profile', verifyToken, async (req, res) => {
//   try {
//     const user = await User.findByPk(req.user.id);
//     if (!user) return res.status(404).json({ error: 'User not found' });
    
//     res.json({ id: user.id, firstname: user.firstname, lastname: user.lastname, email: user.email, role: user.role });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
