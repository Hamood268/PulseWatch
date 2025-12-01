# ⚡ PulseWatch - Always Watching

A modern, real-time API monitoring platform built with Node.js, Express, and MongoDB. Keep your APIs and endpoints healthy with continuous uptime monitoring, performance tracking, and instant status updates.

## ✨ Features

### 🎯 Core Monitoring
- **Real-time Endpoint Monitoring** - Continuously check API health with customizable interval options
- **Uptime Tracking** - Calculate and display uptime percentages based on historical data
- **Response Time Analytics** - Monitor and track API response times with millisecond precision
- **Status History** - Keep up to 100 historical checks per endpoint for trend analysis
- **Multi-Endpoint Management** - Monitor unlimited APIs from a single dashboard

### 💎 User Experience
- **Intuitive Dashboard** - Clean, modern interface with real-time status updates
- **User Profiles** - Personal monitoring workspace for each user
- **Mobile Responsive** - Fully functional on desktop, tablet, and mobile devices
- **Visual Status Indicators** - Instant health status with color-coded indicators (Online/Offline)
- **Smart Filtering** - Filter endpoints by status (All/Online/Offline)

### 🔒 Security & Authentication
- **JWT Authentication** - Secure user sessions with HTTP-only cookies
- **Input Validation** - Comprehensive XSS protection and input sanitization
- **Rate Limiting** - Built-in protection against abuse
- **User Authorization** - Users can only access their own monitors
- **Password Encryption** - Bcrypt hashing with salt rounds

### 🛠️ Technical Features
- **RESTful API** - Clean, well-documented API endpoints
- **Automatic Scheduler** - Background jobs for continuous monitoring
- **Dynamic Scheduler Updates** - Automatically restarts monitoring when URL/interval changes
- **Graceful Shutdown** - Properly cleanup schedulers on server stop
- **Error Handling** - Comprehensive error handling and logging
- **CORS Support** - Configured for secure cross-origin requests

## 🚀 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **Modern CSS** - Custom styling with CSS variables
- **Responsive Design** - Mobile-first approach
- **Real-time Updates** - Auto-refresh every 10 seconds

### Security
- **Input Sanitization** - XSS protection
- **HTTP-only Cookies** - Secure token storage
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Request throttling

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/hamood268/pulsewatch.git
cd pulsewatch
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
# Create .env file in Backend directory
PORT=3000
MONGODB_URI=mongodb://localhost:27017/pulsewatch
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=development
```

4. **Start MongoDB**
```bash
# Make sure MongoDB is running
mongod
```

5. **Run the application**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

6. **Access the application**
```
Open http://localhost:3000 in your browser
```

## 🖥️ Live Website

Try out PulseWatch exclusively [here!](https://pulsewatch-led1.onrender.com/)

## 📖 API Documentation

API Documentation can be viewed live [here](https://pulsewatch-led1.onrender.com/api/docs)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Developer

**Mohammed**
- Twitter: [@ha268h](https://x.com/ha268h)
- GitHub: [@hamood268](https://github.com/hamood268)
- PayPal: [Support](https://paypal.me/Mohammed0268)