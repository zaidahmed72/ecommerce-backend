# 🛒 E-Commerce Backend REST API

A production-ready E-Commerce Backend REST API built using Node.js, Express.js, MongoDB, and JWT Authentication.

The project includes user authentication, role-based authorization, product management, cart system, order processing, and secure API handling.

---

# 🚀 Live API

https://ecommerce-backend-fvge.onrender.com

---

# 🛠 Tech Stack

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- Cookies
- REST API
- Helmet
- CORS
- Express Rate Limit
- Render Deployment

---

# ✨ Features

## 🔐 Authentication

- User Registration
- User Login
- JWT Authentication
- Protected Routes
- Cookie Based Authentication

---

## 👤 User Features

- Get Profile
- Update Profile

---

## 📦 Product Management

- Create Product (Admin)
- Get All Products
- Get Single Product
- Update Product (Admin)
- Delete Product (Admin)

Additional features:

- Search Products
- Category Filtering
- Pagination
- Price Sorting

---

## 🛒 Cart System

- Add Product To Cart
- Update Product Quantity
- Remove Cart Item
- Clear Cart
- Get User Cart

---

## 📋 Order System

- Create Order
- Get User Orders
- Get Single Order
- Get All Orders (Admin)
- Update Order Status

Order workflow:

Pending → Shipped → Delivered

---

# 🔒 Security

Implemented:

- Helmet Security Headers
- CORS Protection
- Rate Limiting
- JWT Middleware
- Role Based Authorization
- Central Error Handling Middleware

---

# 📁 Project Structure
src
│
├── config
│ ├── db.js
│ └── env.js
│
├── controllers
│
├── middleware
│
├── models
│
├── routes
│
├── app.js
└── server.jssrc
│
├── config
│ ├── db.js
│ └── env.js
│
├── controllers
│
├── middleware
│
├── models
│
├── routes
│
├── app.js
└── server.js

---

# ⚙️ Installation

Clone repository:

```bash
git clone https://github.com/zaidahmed72/ecommerce-backend.git
Go inside project:

cd ecommerce-backend

Install dependencies:

npm install
🔑 Environment Variables

Create .env file:

PORT=3000

MONGO_URL=your_mongodb_connection_string

JWT_SECRET=your_secret_key
▶️ Run Project

Development:

npm run dev

Production:

npm start
📌 API Endpoints
Authentication
POST /api/users/register

POST /api/users/login
Products
GET    /api/products

GET    /api/products/:id

POST   /api/products

PUT    /api/products/:id

DELETE /api/products/:id
Cart
GET    /api/cart

POST   /api/cart

PUT    /api/cart/:id

DELETE /api/cart/:id
Orders
POST /api/orders

GET /api/orders

GET /api/orders/:id
🌐 Deployment

Backend deployed using:

Render
MongoDB Atlas
👨‍💻 Author

Zaid Ahmed