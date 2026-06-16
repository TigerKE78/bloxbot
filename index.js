const {
  Client, GatewayIntentBits, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelType, PermissionFlagsBits
} = require('discord.js');
const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────
//  LOG
// ─────────────────────────────────────────
const LOG_DIR  = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'mazahub.log');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);
function timestamp() { return new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }); }
function writeLog(type, text) {
  const line = `[${timestamp()}] [${type}] ${text}\n`;
  fs.appendFileSync(LOG_FILE, line, 'utf8');
  console.log(line.trim());
}

// ─────────────────────────────────────────
//  ตั้งค่า
// ─────────────────────────────────────────
const WELCOME_CHANNEL_NAME = 'welcome';
const TICKET_CHANNEL_NAME  = 'create-ticket';
const TICKET_CATEGORY_NAME = 'tickets';
const STAFF_ROLE_NAME      = 'Staff';
const ALLOWED_CHANNEL_IDS  = [];

// รูป Banner MazaHub (URL รูปจาก Discord หรือ Imgur)
const BANNER_URL = 'https://cdn.discordapp.com/attachments/1479847528307621918/1516321299415302184/file_000000006578722fa3c391908e90605e.jpg?ex=6a3237c1&is=6a30e641&hm=6dea4ad9f1cc0825590b4b4dfb1649d0408ecf8794aacb14dcccea9168ea9f03&'; // เปลี่ยนเป็น URL รูป MazaHub ของคุณ

// ─────────────────────────────────────────
//  KEYWORD REPLIES
// ─────────────────────────────────────────
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
];

// ─────────────────────────────────────────
//  CLIENT
// ─────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

// ─────────────────────────────────────────
//  READY
// ─────────────────────────────────────────
client.once('clientReady', (c) => {
  writeLog('INFO', `MazaHub Bot ออนไลน์! → ${c.user.tag}`);
});

// ─────────────────────────────────────────
//  WELCOME
// ─────────────────────────────────────────
client.on('guildMemberAdd', async (member) => {
  const guild = member.guild;

  const embed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('🔥 WELCOME TO MAZAHUB SPACE!')
    .setDescription(
      `> ★ ยินดีต้อนรับ ${member} เข้าสู่ **MazaHub Space**!\n` +
      `> 🇹🇭 : ร้านเปิด **24 ชั่วโมง** พร้อมให้บริการตลอดเวลา\n` +
      `> 🇬🇧 : Open **24 hours**, ready to serve you anytime!\n` +
      `> 💬 discord.gg/Kxybtt6Ssa`
    )
    .setImage(BANNER_URL)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: `MazaHub Space • สมาชิกคนที่ ${guild.memberCount}` })
    .setTimestamp();

  const wch = guild.channels.cache.find(
    (c) => c.name === WELCOME_CHANNEL_NAME && c.type === ChannelType.GuildText
  );
  if (wch) {
    await wch.send({ embeds: [embed] }).catch(() => {});
    writeLog('WELCOME', `ช่อง #welcome → ${member.user.tag}`);
  }

  // DM
  const dmEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('🔥 ยินดีต้อนรับสู่ MazaHub Space!')
    .setDescription(
      `สวัสดี **${member.user.username}**! 👋\n\n` +
      `> 🇹🇭 : ร้านเปิด **24 ชั่วโมง** พร้อมให้บริการ\n` +
      `> 🇬🇧 : Shop open **24 hours**, always ready!\n` +
      `> 🎫 มีปัญหา? กดปุ่ม **Open a ticket!** ได้เลย\n` +
      `> 💬 discord.gg/Kxybtt6Ssa`
    )
    .setImage(BANNER_URL)
    .setTimestamp();

  await member.send({ embeds: [dmEmbed] }).catch(() => {
    writeLog('WARN', `DM ปิดอยู่ → ${member.user.tag}`);
  });
});

// ─────────────────────────────────────────
//  MESSAGE
// ─────────────────────────────────────────
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const content = message.content.toLowerCase().trim();

  // !setup-ticket
  if (message.content === '!setup-ticket') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator))
      return message.reply('❌ ต้องเป็น Admin ถึงจะใช้คำสั่งนี้ได้!');

    const tch = message.guild.channels.cache.find(
      (c) => c.name === TICKET_CHANNEL_NAME && c.type === ChannelType.GuildText
    );
    if (!tch) return message.reply(`❌ หาช่อง #${TICKET_CHANNEL_NAME} ไม่เจอ!`);

    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🎫 Open a ticket!')
      .setDescription(
        `★ Open a ticket to buy or inquire\n` +
        `🇹🇭 : ซื้อของ หรือ สอบถาม กดปุ่มด้านล่างมาเลยยย\n` +
        `🇬🇧 : To buy things or inquire, press the button below.\n`
      )
      .setImage(BANNER_URL)
      .setFooter({ text: 'MazaHub Space • Powered by MazaHub Bot' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('open_ticket')
        .setLabel('🎫 Open a ticket!')
        .setStyle(ButtonStyle.Danger),
    );

    await tch.send({ embeds: [embed], components: [row] });
    return message.reply('✅ วางปุ่ม Ticket สำเร็จแล้ว!');
  }

  // !ticket
  if (message.content === '!ticket') {
    const ch = await createTicket(message.guild, message.member);
    if (ch) return message.reply(`✅ เปิด Ticket แล้ว! → ${ch}`);
    return message.reply('⚠️ คุณมี Ticket ที่เปิดอยู่แล้ว!');
  }

  // Blox Keywords
  if (ALLOWED_CHANNEL_IDS.length > 0 && !ALLOWED_CHANNEL_IDS.includes(message.channel.id)) return;

  let matched = null, matchedKw = null;
  for (const entry of KEYWORD_REPLIES) {
    const kw = entry.keywords.find((k) => content.includes(k));
    if (kw) { matched = entry; matchedKw = kw; break; }
  }

  if (matched) {
    try {
      await message.reply(matched.reply);
      writeLog('REPLY', `keyword="${matchedKw}" | user=${message.author.tag}`);
    } catch (err) {
      writeLog('ERROR', `ส่งไม่ได้: ${err.message}`);
    }
  } else {
    writeLog('SKIP', `user=${message.author.tag} | msg="${message.content.slice(0, 60)}"`);
  }
});

// ─────────────────────────────────────────
//  BUTTON
// ─────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'open_ticket') {
    await interaction.deferReply({ ephemeral: true });
    const ch = await createTicket(interaction.guild, interaction.member);
    if (ch) return interaction.editReply(`✅ เปิด Ticket แล้ว! → ${ch}`);
    return interaction.editReply('⚠️ คุณมี Ticket ที่เปิดอยู่แล้ว!');
  }

  if (interaction.customId === 'close_ticket') {
    if (!interaction.channel.name.startsWith('ticket-')) return;
    await interaction.reply('🔒 กำลังปิด Ticket... (3 วินาที)');
    setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
    writeLog('TICKET', `ปิด → ${interaction.channel.name}`);
  }
});

// ─────────────────────────────────────────
//  HELPER สร้าง Ticket
// ─────────────────────────────────────────
async function createTicket(guild, member) {
  const ticketName = `ticket-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const existing = guild.channels.cache.find((c) => c.name === ticketName);
  if (existing) return null;

  const staffRole = guild.roles.cache.find((r) => r.name === STAFF_ROLE_NAME);
  const category  = guild.channels.cache.find(
    (c) => c.name.toLowerCase() === TICKET_CATEGORY_NAME && c.type === ChannelType.GuildCategory
  );

  const ticketCh = await guild.channels.create({
    name: ticketName,
    type: ChannelType.GuildText,
    parent: category || null,
    permissionOverwrites: [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      ...(staffRole ? [{ id: staffRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }] : []),
    ],
  });

  const embed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('🎫 Ticket เปิดแล้ว!')
    .setDescription(
      `สวัสดี ${member}! 👋\n\n` +
      `> 🇹🇭 : ทีมงาน **MazaHub Space** จะมาช่วยเร็วๆ นี้ 🔥\n` +
      `> 🇬🇧 : Our team will assist you shortly!\n` +
      `> อธิบายปัญหาหรือสิ่งที่ต้องการได้เลย!`
    )
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('🔒 ปิด Ticket / Close Ticket')
      .setStyle(ButtonStyle.Danger),
  );

  await ticketCh.send({ content: `${member}`, embeds: [embed], components: [row] });
  writeLog('TICKET', `เปิด → ${ticketCh.name} | ${member.user.tag}`);
  return ticketCh;
}

client.on('error', (err) => writeLog('ERROR', err.message));
client.login(process.env.DISCORD_TOKEN || 'YOUR_BOT_TOKEN_HERE');
