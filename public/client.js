const socket = io();
let currentRoom = "general";

document.getElementById("roomSelect").addEventListener("change", (e) => {
  socket.emit("join room", e.target.value);
  currentRoom = e.target.value;
  document.getElementById("messages").innerHTML = "";
});

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");

form.addEventListener("submit", function (e) {
  e.preventDefault();
  if (input.value) {
    socket.emit("chat message", {
      room: currentRoom,
      text: input.value
    });
    input.value = '';
  }
});

socket.on("chat message", function (msg) {
  const item = document.createElement("li");
  item.innerHTML = `<strong>${msg.username}:</strong> ${msg.text}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});
