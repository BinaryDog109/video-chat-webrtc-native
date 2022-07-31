const app = require("express")()
const server = require('http').createServer(app)
const { Server } = require("socket.io");
const cors = require('cors')
const io = new Server(server, {
    cors: {
        origin: '*',
        
    }
})
app.use(cors())
// roomId: [id1, id2, ...]
const rooms = {}

io.on('connection', socket => {
    socket.on('join room', roomId => { 
        const currentUserSocketId = socket.id
        console.log("joining room!")
        // The front end will pulling the room id from url

        // if the room already exists, push the new user. Otherwise create an entry in the rooms object
        socket.join(roomId) 
        if (rooms[roomId]) {
            rooms[roomId].push(currentUserSocketId)
        }
        else {
            rooms[roomId] = [currentUserSocketId]
        }  
        console.log(`Current rooms: `, rooms)
        // !Get the other user's socket id (any time only two people in a room)
        const otherUserSocketIds = rooms[roomId].filter(userSocketId => userSocketId !== currentUserSocketId)
        if (otherUserSocketIds.length > 0) {
            // inform current user that there are other users in the room
            socket.emit('other users', otherUserSocketIds) 
            // inform other users
            socket.to(roomId).emit("user joined", currentUserSocketId)
        } 
     
        socket.on('disconnect', () => { 
            console.log(`${socket.id} has disconnected`)
            const disconnectedUser = socket.id
            const index = rooms[roomId].indexOf(disconnectedUser)
            // !maybe consider a map 
            rooms[roomId].splice(index, 1)
            
            socket.to(roomId).emit('user left', disconnectedUser)

            // If no user in the room, remove the room
            if (rooms[roomId].length === 0) {
                delete rooms[roomId]
            }
        })   
         
    })

    // Receive and sending offer/answer to the target
    socket.on('offer', payload => {
        io.to(payload.target).emit('offer', payload)
    })
    socket.on('answer', payload => {
        io.to(payload.target).emit('answer', payload)
    })
  
    // Receive and sending icecandidate
    socket.on(`ice-candidate-${socket.id}`, payload => {
        io.to(payload.target).emit(`ice-candidate-${socket.id}`, payload)
    })
 
    // After handshaking 
    socket.on('answer received', otherUser => {
        console.log(`Sent answer received event to ${otherUser}`)
        io.to(otherUser).emit('answer received', socket.id)
    })
    
})

server.listen(8000)