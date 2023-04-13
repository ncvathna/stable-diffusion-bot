require("dotenv").config()
const http = require("http")
const fs = require("fs")

if (!fs.existsSync("./tmp")){
    fs.mkdirSync("./tmp");
}

const TelegramBot = require("node-telegram-bot-api")
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {polling: true})
bot.onText(/^[^\/].*/, (message, _) => {
    const promptRequest = JSON.stringify({
        "sampler_name": "DPM++ 2M Karras",
        "steps": 20,
        "cfg_scale": 7,
        "width": 512,
        "height": 512,
        "restore_faces": false,
        "prompt": "best quality, rugged details, hdr, masterpiece, cinematic lighting, " + message.text,
        "negative_prompt": "nsfw, nude, naked"
    })

    var response = ""
    const req = http.request({
        host: process.env.SD_API_HOST,
        port: process.env.SD_API_PORT,
        path: "/sdapi/v1/txt2img",
        method: "POST"
    }, (res) => {
        res.on("data", (chunk) => response += chunk)
        res.on("end", () => {
            const result = JSON.parse(response)
            const filename = "./tmp/" + message.chat.id + "_" + message.date + ".png"
            fs.writeFile(filename, result.images[0], "base64", (error) => {
                if (error) console.log(error)
                else {
                    bot.sendPhoto(message.chat.id, filename).finally(() => fs.unlink(filename, () => {}))
                }
            })
        })
    })
    req.write(promptRequest)
    req.end()
})