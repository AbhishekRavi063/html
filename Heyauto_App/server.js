const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const admin = require('firebase-admin');
const ejs = require('ejs');
const cors = require('cors'); // Import cors

const app = express();
const PORT = process.env.PORT || 3000;

// Set up Firebase Admin SDK
const serviceAccount = require('./firebase_DB.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

app.set('view engine', 'ejs'); // Set EJS as the view engine

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

const corsOptions = {
  origin: 'http://localhost:3001', // Allow requests from localhost:3001
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

// Serve signup page with Firebase Phone Auth
app.get('/signup', (req, res) => {
  res.sendFile(__dirname + '/signup.html');
});

async function isEmailExists(email) {
  if (!email) {
    return false; // Return false if email is undefined or empty
  }
  
  const emailSnapshot = await db.collection('cabs').where('email', '==', email).get();
  return !emailSnapshot.empty;
}


app.post('/signup', async (req, res) => {
  try {
    const { name, phone, vehicleNumber, autoName, email, password } = req.body;

    const emailExists = await isEmailExists(email);
    // ... (other validation logic)

    if (emailExists /* || other validation checks */) {
      return res.status(400).send('Email or Phone Number already exists');
    }

    // ... (perform signup process)

    res.send('Signup successful');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error during signup');
  }
});


// Serve login page
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

// Handle login form submission using Firebase Authentication
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const userSnapshot = await db.collection('cabs').where('email', '==', email).get();

    if (userSnapshot.empty) {
      return res.status(400).send('User not found');
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    if (userData.password !== password) {
      return res.status(401).send('Invalid password');
    }

    req.session.user = userData;

    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error during login');
  }
});

// Serve profile page
app.get('/profile', (req, res) => {
  if (req.session.user) {
    // Render the profile page with user data
    res.render('profile', { user: req.session.user });
  } else {
    res.redirect('/login');
  }
});

// Implement logout logic
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect('/login');
  });
});



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

async function isEmailExists(email) {
  const emailSnapshot = await db.collection('cabs').where('email', '==', email).get();
  return !emailSnapshot.empty;
}

async function isPhoneExists(phone) {
  const phoneSnapshot = await db.collection('cabs').doc(phone).get();
  return phoneSnapshot.exists;
}
