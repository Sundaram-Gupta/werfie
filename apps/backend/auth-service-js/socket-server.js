const { Server } = require("socket.io");
const { createServer } = require("http");
const { prisma } = require("./lib/prisma");
const { verifyToken } = require("./lib/jwt");
require("dotenv").config();

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error("Authentication error"));

        const payload = await verifyToken(token);
        socket.user = payload;
        next();
    } catch (err) {
        console.error("Socket auth error:", err.message);
        next(new Error("Authentication error"));
    }
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.user.sub);

    socket.on("join_conversation", (conversationId) => {
        socket.join(conversationId);
        console.log(`User ${socket.user.sub} joined ${conversationId}`);
    });

    socket.on("leave_conversation", (conversationId) => {
        socket.leave(conversationId);
    });

    socket.on("send_message", async (data) => {
        try {
            const { conversationId, content, mediaUrl, mediaType } = data;

            // Save to Database
            const message = await prisma.message.create({
                data: {
                    content,
                    mediaUrl,
                    mediaType,
                    conversationId,
                    senderId: socket.user.sub
                },
                include: {
                    sender: {
                        select: { id: true, name: true, avatar: true, handle: true }
                    }
                }
            });

            io.to(conversationId).emit("new_message", message);
            console.log(`Message sent in ${conversationId}: ${message.id}`);

        } catch (e) {
            console.error("Error sending message:", e);
            socket.emit("error", { message: "Failed to send message" });
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.user.sub);
    });
});

const PORT = 3013;
httpServer.listen(PORT, () => {
    console.log(`Socket server running on port ${PORT}`);
});
