const { Client, GatewayIntentBits } = require('discord.js');
const fs   = require('fs');
const path = require('path');

const LOG_DIR  = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'bot.log');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

function timestamp() {
  return new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
}
function writeLog(type, text) {
  const line = `[${timestamp()}] [${type}] ${text}\n`;
  fs.appendFileSync(LOG_FILE, line, 'utf8');
  console.log(line.trim());
}

const ALLOWED_CHANNEL_IDS = [];

const KEYWORD_REPLIES = [
  {
    keywords: ['bloxfruit', 'blox fruit'],
    reply: `🍎 **Blox Fruit Info!** ⚔️\n> เลเวลสูงสุด: **2550**\n> Discord: https://discord.gg/bloxfruits`
  },
  {
    keywords: ['blox'],
    reply: `🎮 **Blox** มีหลายเกมใน Roblox!\n> 🍎 Blox Fruit\n> ⚔️ Blox Piece`
  },
  {
    keywords: ['bf'],
    reply: `⚔️ **BF = Blox Fruit** 🍎\n> พิมพ์ \`bloxfruit\` เพื่อดูข้อมูลเพิ่มเติม!`
  },
  {
    keywords: ['fruit', 'ผลไม้'],
    reply: `🍇 **Devil Fruit ยอดนิยม**\n> 🌋 Magma\n> ✨ Buddha\n> 🐉 Dragon\n> 💎 Leopard`
  },
  {
    keywords: ['raid', 'เรด'],
    reply: `⚡ **Raid Guide**\n> 1️⃣ ซื้อ Raid Chip\n> 2️⃣ ไป Mysterious Scientist\n> 3️⃣ ชวนเพื่อน 4 คน!`
  },
  {
    keywords: ['level', 'เลเวล', 'lvl'],
    reply: `📈 **Leveling Guide**\n> 1-700 → Quest ตามเกาะ\n> 700-1500 → Magma Village\n> 1500-2550 → Cake Island`
  },
  {
    keywords: ['code', 'โค้ด'],
    reply: `🎁 **Blox Fruit Codes**\n> กด M เพื่อใส่ Code\n> ติดตามได้ที่ Twitter: @BloxFruits`
  },
  {
    keywords: ['ku', ''],
    reply: `😄 ว่าไง! มีอะไรให้ช่วยเรื่อง Blox Fruit ไหม?`
  },
];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  writeLog('INFO', `บอทออนไลน์แล้ว! → ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (ALLOWED_CHANNEL_IDS.length > 0 && !ALLOWED_CHANNEL_IDS.includes(message.channel.id)) return;

  const content = message.content.toLowerCase().trim();
  let matched = null;
  let matchedKeyword = null;

  for (const entry of KEYWORD_REPLIES) {
    const kw = entry.keywords.find((k) => content.includes(k));
    if (kw) { matched = entry; matchedKeyword = kw; break; }
  }

  if (matched) {
    try {
      await message.reply(matched.reply);
      writeLog('REPLY', `keyword="${matchedKeyword}" | user=${message.author.tag} | msg="${message.content.slice(0, 80)}"`);
    } catch (err) {
      writeLog('ERROR', `ส่งข้อความล้มเหลว: ${err.message}`);
    }
  } else {
    writeLog('SKIP', `user=${message.author.tag} | msg="${message.content.slice(0, 60)}"`);
  }
});

client.on('error', (err) => {
  writeLog('ERROR', `Discord error: ${err.message}`);
});

client.login(process.env.DISCORD_TOKEN || 'YOUR_BOT_TOKEN_HERE');
