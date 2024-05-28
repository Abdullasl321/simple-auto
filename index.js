const { BaileysClass } = require("@bot-wa/bot-wa-baileys");
const qri = require("qr-image");

const botBaileys = new BaileysClass({});

botBaileys.on("auth_failure", async (error) =>
    console.log("ERROR BOT: ", error),
);
botBaileys.on("qr", (qr) => {
    //console.log("NEW QR CODE: ", qr);

    // var svg_string = qri.imageSync(qr, { type: "png" });
    var qr_svg = qri.image(qr, { type: "png" });
    qr_svg.pipe(require("fs").createWriteStream("./public/qr.png"));
});
botBaileys.on("ready", async () => console.log("READY BOT"));

let awaitingResponse = false;

botBaileys.on("message", async (message) => {
    botBaileys.sendMessage(
        message.from,
        "*Hello There!* \n Thank you for contacting me!, I will reply to you as soon as possible. 🙂",
    );
});
