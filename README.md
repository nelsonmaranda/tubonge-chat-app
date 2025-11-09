# 💬 Tubonge - Real-Time Chat Application

A modern, production-ready MERN stack chat application with real-time messaging capabilities using Socket.io.

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🌟 Features

- **Real-time Messaging**: Instant message delivery using Socket.io
- **User Authentication**: Secure JWT-based authentication  
- **User Presence**: See who's online in real-time
- **Typing Indicators**: Know when someone is typing
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Sky Blue Theme**: Beautiful gradient background
- **Production Ready**: Deployed with CI/CD pipelines

## 🚀 Live Demo

- **Frontend**: https://your-app.vercel.app *(Add your URL after deployment)*
- **Backend API**: https://your-backend.onrender.com *(Add your URL after deployment)*
- **Health Check**: https://your-backend.onrender.com/health

## 🛠️ Tech Stack

### Backend
- Node.js + Express.js
- Socket.io (Real-time communication)
- MongoDB Atlas (Database)
- JWT (Authentication)
- bcryptjs (Password hashing)
- Helmet + CORS (Security)

### Frontend
- React 18 + Vite
- Socket.io-client
- Axios (HTTP client)
- CSS3 (Custom styling)

### DevOps
- GitHub Actions (CI/CD)
- Render (Backend hosting)
- Vercel (Frontend hosting)

---

## 📁 Project Structure

```
Week 7/
├── backend/
│   ├── models/          # MongoDB schemas (User, Message)
│   ├── routes/          # API routes (auth, messages)
│   ├── middleware/      # JWT authentication
│   ├── server.js        # Main server file
│   ├── package.json
│   └── render.yaml      # Render deployment config
│
├── frontend/
│   ├── src/
│   │   ├── components/  # React components (Auth, Chat)
│   │   ├── utils/       # API and Socket utilities
│   │   ├── App.jsx
│   │   └── App.css
│   ├── package.json
│   └── vercel.json      # Vercel deployment config
│
└── .github/
    └── workflows/       # CI/CD pipelines (4 workflows)
```

---

## 🏃 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account (free tier)
- Git

### 1️⃣ Clone and Install

```bash
# Navigate to project
cd "C:\PLP\MERN\Week 7"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2️⃣ Setup MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (M0)
3. Create database user
4. Whitelist IP (0.0.0.0/0 for testing)
5. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/tubonge?retryWrites=true&w=majority
   ```

### 3️⃣ Configure Environment Variables

**Create `backend/.env`:**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_secure_random_string
FRONTEND_URL=http://localhost:5173
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Create `frontend/.env`:**
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 4️⃣ Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Server runs on: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: http://localhost:5173

### 5️⃣ Test the Application

1. Open http://localhost:5173
2. Register a new user
3. Send messages
4. Open incognito window and register another user
5. Test real-time messaging between users!

---

## 🚀 Deployment to Production

### Prerequisites
- GitHub repository
- MongoDB Atlas cluster (completed above)
- [Render](https://render.com) account
- [Vercel](https://vercel.com) account

### Step 1: Push to GitHub

```bash
cd "C:\PLP\MERN\Week 7"
git init
git add .
git commit -m "Complete Tubonge chat application"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 2: Deploy Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `tubonge-backend`
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

5. Add **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_generated_secret
   FRONTEND_URL=https://your-app.vercel.app
   ```

6. Click **"Create Web Service"**
7. Wait 5-10 minutes for deployment
8. Copy your backend URL (e.g., `https://tubonge-backend.onrender.com`)

### Step 3: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add **Environment Variables**:
   ```
   VITE_API_URL=https://tubonge-backend.onrender.com
   VITE_SOCKET_URL=https://tubonge-backend.onrender.com
   ```

6. Click **"Deploy"**
7. Wait 2-3 minutes
8. Copy your frontend URL (e.g., `https://tubonge.vercel.app`)

### Step 4: Update Backend FRONTEND_URL

1. Go back to Render dashboard
2. Open your backend service
3. Go to **"Environment"**
4. Update `FRONTEND_URL` with your Vercel URL
5. Save changes (triggers redeployment)

### Step 5: Test Production Deployment

1. Visit your frontend URL
2. Register and login
3. Send messages
4. Test real-time features

✅ **Deployment Complete!**

---

## 🔧 API Documentation

### Authentication Endpoints

**Register User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john",
  "email": "john@example.com",
  "password": "password123"
}
```

**Login User**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Get Profile** (Protected)
```http
GET /api/auth/profile
Authorization: Bearer {token}
```

### Message Endpoints

**Get Messages** (Protected)
```http
GET /api/messages?limit=50
Authorization: Bearer {token}
```

### Health Check

```http
GET /health
```

### Socket.io Events

**Client → Server:**
- `sendMessage` - Send a new message
- `typing` - User started typing
- `stopTyping` - User stopped typing

**Server → Client:**
- `newMessage` - Receive new message
- `activeUsers` - Active users list updated
- `userTyping` - User is typing
- `userStopTyping` - User stopped typing

---

## 📊 CI/CD Pipeline

### GitHub Actions Workflows

1. **Backend CI** - Tests and builds backend on push
2. **Frontend CI** - Tests and builds frontend on push
3. **Backend CD** - Auto-deploys to Render on main branch
4. **Frontend CD** - Auto-deploys to Vercel on main branch

### CI/CD Pipeline in Action

![GitHub Actions CI/CD Pipeline](screenshots/github-actions-pipeline.png)

The screenshot above shows the GitHub Actions workflow runs for the Tubonge chat application, demonstrating successful CI/CD pipeline execution with multiple workflow runs including Frontend CD, Backend CD, and CI tests.

### Setup CI/CD

Add these secrets to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add secrets:
   - `VERCEL_TOKEN` - From [Vercel Tokens](https://vercel.com/account/tokens)
   - `VERCEL_ORG_ID` - From Vercel project settings
   - `VERCEL_PROJECT_ID` - From Vercel project settings
   - `VITE_API_URL` - Your backend URL
   - `VITE_SOCKET_URL` - Your backend URL

---

## 🧪 Testing

### Test Locally

**Backend:**
```bash
cd backend
npm test
```

**Frontend:**
```bash
cd frontend  
npm test
```

### Test Real-Time Features

1. Open app in two browser windows
2. Register different users in each
3. Send messages
4. Verify messages appear instantly in both windows
5. Check typing indicators
6. Verify active user count updates

---

## 🔐 Security Features

- ✅ JWT authentication
- ✅ Password hashing (bcryptjs)
- ✅ HTTP security headers (Helmet)
- ✅ CORS protection
- ✅ Rate limiting (100 requests/15 min)
- ✅ Input validation
- ✅ MongoDB injection prevention

---

## 📈 Monitoring

### Health Check
Monitor backend health: `GET https://your-backend.onrender.com/health`

---

## 🐛 Troubleshooting

### Backend Issues

**Can't connect to MongoDB:**
- Check IP whitelist in Atlas (use 0.0.0.0/0)
- Verify connection string format
- Check database user credentials

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Frontend Issues

**Can't connect to backend:**
- Verify `VITE_API_URL` in `.env`
- Check CORS settings in backend
- Ensure backend is running

**Real-time not working:**
- Check Socket.io connection in browser console
- Verify `VITE_SOCKET_URL` is correct
- Check firewall settings

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## 📝 Assignment Checklist

**PLP Academy MERN Stack Week 7: Deployment and DevOps Essentials**

- [x] ✅ Task 1: Application prepared for deployment
- [x] ✅ Task 2: Backend deployed to cloud platform (Render)
- [x] ✅ Task 3: Frontend deployed to static hosting (Vercel)
- [x] ✅ Task 4: CI/CD pipelines with GitHub Actions
- [x] ✅ Task 5: Monitoring and maintenance setup

---

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Nelson Maranda**
- GitHub: [@nelsonmaranda](https://github.com/nelsonmaranda)

## 🙏 Acknowledgments

- PLP Academy - MERN Stack Development Course
- Week 7 Assignment: Deployment and DevOps Essentials
- Socket.io and React documentation

---

## 📞 Support

For questions or issues:
- Open an issue in the repository
- Email: nelsonmaranda2@gmail.com

---

**Made with ❤️ for PLP Academy MERN Stack Development Week 7 Assignment**

🚀 **Ready to chat? Deploy Tubonge now!**
