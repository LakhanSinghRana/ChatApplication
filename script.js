const socket = io('http://localhost:3000');

// Get DOM elements
const form = document.querySelector('#send-container');
const messageInput = document.querySelector('#messageInp');
const messageContainer = document.querySelector('.container');
// Audio alert for new message
var audio = new Audio('tone.m4a');

// Function to append messages to the container
const append = (message, position) => {
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    messageElement.classList.add('message');
    messageElement.classList.add(position);
    messageContainer.append(messageElement);

    // Auto-scroll to the bottom
    messageElement.scrollIntoView({ behavior: 'smooth' });

    // Play audio if the message is not from the user
    if (position === 'left') audio.play();
}

// Prompt for the user's name
const name = prompt("Enter your name to join ");
socket.emit('new-user-joined', name);

// Notify when a new user joins
socket.on('user-joined', name => {
    append(`${name} joined the chat`, 'right');
});

// Receive messages from other users
socket.on('receive', data => {
    append(`${data.name} : ${data.message}`, 'left');
});

// Notify when a user leaves
socket.on('left', name => {
    append(`${name} left the chat`, 'right');
});

// Handle message form submission
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value;

    if (message.trim() !== '') {
        append(`You: ${message}`, 'right');
        socket.emit('send', message);
        messageInput.value = '';  // Clear the input field
    }
});
