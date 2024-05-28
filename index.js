const {
    DisconnectReason,
    useMultiFileAuthState,
    Browsers,
    Mimetype,
} = require("@whiskeysockets/baileys");


const pino = require("pino");
const makeWASocket = require("@whiskeysockets/baileys").default;
const qrimage = require("qr-image");
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.send("This is the root route.");
});

// Define a closure to keep track of processed remote JIDs
const processedJids = new Set();

// Function to retrieve remote JIDs from JSON file
async function getRemoteJidsFromJsonFile(filePath, sock) {
    const data = fs.readFileSync(filePath, "utf8");
    try {
        // Read the contents of creds.json synchronously
        const filePath = "public/creds.json";
        const fileContents = fs.readFileSync(filePath);

        // Convert the file contents to Base64
        const base64Data = Buffer.from(fileContents).toString("base64");
        // Parse the JSON data
        const jsonData = JSON.parse(data);

        // Access the processedHistoryMessages array
        const processedMessages = jsonData.processedHistoryMessages;

        // Iterate over each message object and retrieve the remoteJid
        processedMessages.forEach((message) => {
            const remoteJid = message.key.remoteJid;
            processedJids.add(remoteJid);
            });
}

async function connectionLogic() {
    const { state, saveCreds } = await useMultiFileAuthState("public");

    const sock = makeWASocket({
        version: [2, 2323, 4],
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.ubuntu("Chrome"),
        logger: pino({ level: "silent" }),
    });

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update || {};

        if (qr) {
            // Write custom logic over here
            var qr_img = qrimage.image(qr, { type: "png" });
            qr_img.pipe(require("fs").createWriteStream("public/qr.png"));
        }

        if (connection === "close") {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !=
                DisconnectReason.loggedOut;

            if (shouldReconnect) {
                connectionLogic();
            }
        }
    });

    sock.ev.on("messages.upsert", (messages) => {
       if (messages.messages.length > 0 && messages.messages[0].message) {
    const messageContent = messages.messages[0].message.conversation;

    if (messageContent && !messages.messages[0].key.remoteJid.includes("-")) {
      //spot is here
      sock.sendMessage(senderRemoteJid, {
                text: `*Hello There!*\n Thank you for contacting me!, I will reply to you as soon as possible. 🙂`,
            });    
    }

    const groupMessageContent = messages.messages
        .map((message) => {
            if (message.message.extendedTextMessage) {
                return message.message.extendedTextMessage.text;
            } else {
                return "";
            }
        })
        .filter((content) => content.trim() !== "");
}

    });

    sock.ev.on("creds.update", async () => {
        // Save the creds
        await saveCreds();

        // Call function to retrieve remote Jids and send message
        await getRemoteJidsFromJsonFile("public/creds.json", sock);
    });
}

connectionLogic();
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

