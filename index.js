const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys")
const axios = require("axios")
const config = require("./config")

async function gemini(prompt) {
    const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.GEMINI_API_KEY}`,
        { contents: [{ parts: [{ text: prompt }] }] }
    )
    return res.data.candidates[0].content.parts[0].text
}

async function openai(prompt) {
    const res = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        },
        {
            headers: { Authorization: `Bearer ${config.OPENAI_API_KEY}` }
        }
    )
    return res.data.choices[0].message.content
}

async function cerebras(prompt) {
    const res = await axios.post(
        "https://api.cerebras.ai/v1/chat/completions",
        {
            model: "llama3-8b",
            messages: [{ role: "user", content: prompt }]
        },
        {
            headers: { Authorization: `Bearer ${config.CEREBRAS_API_KEY}` }
        }
    )
    return res.data.choices[0].message.content
}

async function grok(prompt) {
    const res = await axios.post(
        "https://api.x.ai/v1/chat/completions",
        {
            model: "grok-1",
            messages: [{ role: "user", content: prompt }]
        },
        {
            headers: { Authorization: `Bearer ${config.GROK_API_KEY}` }
        }
    )
    return res.data.choices[0].message.content
}

async function getAI(prompt) {
    try { return await gemini(prompt) }
    catch {
        try { return await openai(prompt) }
        catch {
            try { return await cerebras(prompt) }
            catch {
                try { return await grok(prompt) }
                catch {
                    return "⚠️ All AI systems failed"
                }
            }
        }
    }
}

async function startBot() {

    const { state, saveCreds } = await useMultiFileAuthState("auth")

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("messages.upsert", async (m) => {

        const msg = m.messages[0]
        if (!msg.message) return

        const from = msg.key.remoteJid
        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text

        if (!text) return

        if (text === "!menu") {
            await sock.sendMessage(from, {
                text: `
🤖 ${config.botName}

👤 Owner: ${config.ownerName}

💬 Chat normally — Multi AI ON
                `
            })
        }

        if (!text.startsWith("!")) {
            let reply = await getAI(text)

            await sock.sendMessage(from, {
                text: `
🤖 ${config.botName}

${reply}

⚡ Multi-AI Powered
                `
            })
        }

    })
}

startBot()
