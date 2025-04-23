const express = require("express");
const http = require("http");
const session = require("express-session");
const bcrypt = require("bcrypt");
const { Server } = require("socket.io");
const db = require("./db");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: "supersecret",
  resave: false,
  saveUninitialized: true
}));

app.use(express.static("public"));

// Signup route
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.send("Missing fields");

  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, row) => {
    if (row) return res.send("Username already taken");
    const hashed = await bcrypt.hash(password, 10);
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashed]);
    req.session.user = username;
    res.redirect("/");
  });
});

// Login route
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.send("Invalid credentials");
    }
    req.session.user = username;
    res.redirect("/");
  });
});
// Explicit routes for public pages
app.get("/login.html", (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
});

app.get("/signup.html", (req, res) => {
  res.sendFile(__dirname + "/public/signup.html");
});


// Require login
app.use((req, res, next) => {
  if (["/login.html", "/signup.html", "/login", "/signup"].includes(req.path) || req.path.startsWith("/socket.io")) return next();
  if (!req.session.user) return res.redirect("/login.html");
  next();
});

// Socket auth
io.use((socket, next) => {
  const req = socket.request;
  const res = req.res;
  session({
    secret: "supersecret",
    resave: false,
    saveUninitialized: true
  })(req, res, () => {
    if (req.session.user) {
      socket.username = req.session.user;
      next();
    } else {
      next(new Error("Unauthorized"));
    }
  });
});

// Chat logic
io.on("connection", (socket) => {
  let room = "general";
  socket.join(room);

  socket.on("join room", (newRoom) => {
    socket.leave(room);
    room = newRoom;
    socket.join(room);
  });

  socket.on("chat message", (msg) => {
    io.to(msg.room).emit("chat message", {
      username: socket.username,
      text: msg.text
    });
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
