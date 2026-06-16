const { Client, GatewayIntentBits } = require('discord.js');
const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────
//  LOG HELPER
// ─────────────────────────────────────────
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

// ─────────────────────────────────────────
//  CONFIG — แก้ที่นี่ได้เลย 🛠️
// ─────────────────────────────────────────
{
  keywords: ['ku', 'k'],
  reply: `ข้อความที่บอทจะตอบ`

  ไอสีส
},





// คำที่ตรวจจับ (ไม่สนตัวพิมเล็ก/ใหญ่)
const KEYWORDS = ['blox', 'bloxfruit', 'bf'];

// ช่องที่บอททำงาน (ปล่อยว่าง [] = ทุกช่อง)
const ALLOWED_CHANNEL_IDS = [];

// ─────────────────────────────────────────
//  ข้อความตอบกลับ — แก้ได้เลย ✏️
// ─────────────────────────────────────────
const REPLY_MESSAGE = `

>ควย กูยังทำไม่เสร็จไอโง่

พิมพ์อะไรให้เราช่วยได้อีกไหม? 😄
`;

// ─────────────────────────────────────────
//  BOT
// ─────────────────────────────────────────
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
  const matched = KEYWORDS.find((kw) => content.includes(kw));

  if (matched) {
    try {
      await message.reply(REPLY_MESSAGE);

      // ✅ LOG เมื่อบอทตอบสำเร็จ
      writeLog(
        'REPLY',
        `keyword="${matched}" | user=${message.author.tag} (${message.author.id}) | ` +
        `channel=#${message.channel.name} (${message.channel.id}) | ` +
        `msg="${message.content.slice(0, 80)}"`
      );
    } catch (err) {
      writeLog('ERROR', `ส่งข้อความล้มเหลว: ${err.message}`);
    }
  } else {
    // 🔕 LOG ข้อความที่ผ่านมาแต่ไม่มี keyword (optional — comment ออกได้)
    writeLog(
      'SKIP',
      `user=${message.author.tag} | msg="${message.content.slice(0, 60)}"`
    );
  }
});

client.on('error', (err) => {
  writeLog('ERROR', `Discord error: ${err.message}`);
});

// ใส่ TOKEN บอทของคุณที่นี่
client.login(process.env.DISCORD_TOKEN || 'YOUR_BOT_TOKEN_HERE');
