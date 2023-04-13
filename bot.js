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
        "sampler_name": process.env.SAMPLER_NAME,
        "steps": process.env.STEPS,
        "cfg_scale": process.env.CFG_SCALE,
        "width": process.env.WIDTH,
        "height": process.env.HEIGHT,
        "restore_faces": process.env.RESTORE_FACES,
        "prompt": process.env.POSITVE_PROMPT + message.text,
        "negative_prompt": process.env.NEGATIVE_PROMPT
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