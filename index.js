const {
  Client, GatewayIntentBits, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelType, PermissionFlagsBits, MessageFlags
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

// ─ ตัวนับเลข Ticket (เก็บถาวร ไม่รีเซ็ตตอนบอทรีสตาร์ท) ─
const TICKET_COUNTER_FILE = path.join(LOG_DIR, 'ticket-counter.json');
function getNextTicketNumber() {
  let data = { lastNumber: 0 };
  if (fs.existsSync(TICKET_COUNTER_FILE)) {
    try { data = JSON.parse(fs.readFileSync(TICKET_COUNTER_FILE, 'utf8')); } catch (e) {}
  }
  data.lastNumber = (data.lastNumber || 0) + 1;
  fs.writeFileSync(TICKET_COUNTER_FILE, JSON.stringify(data), 'utf8');
  return data.lastNumber;
}
function formatTicketNumber(n) { return String(n).padStart(4, '0'); }

// ─────────────────────────────────────────
//  ตั้งค่า
// ─────────────────────────────────────────
const WELCOME_CHANNEL_NAME = 'welcome';
const TICKET_CHANNEL_NAME  = 'create-ticket';
const TICKET_CATEGORY_NAME = 'tickets';
const TICKET_LOG_CHANNEL_NAME = 'ticket-logs'; // ชื่อช่อง log เปิด/ปิด ticket
const STAFF_ROLE_NAME      = 'Staff';
const ALLOWED_CHANNEL_IDS  = [];

// ─ ระบบรับยศ (Verify) ─
const VERIFY_CHANNEL_NAME  = 'verify';   // ชื่อช่องที่จะวางปุ่มรับยศ
const VERIFY_ROLE_NAME     = 'Verified'; // ชื่อยศที่จะมอบให้ตอนกดปุ่ม

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
    (c) => c.type === ChannelType.GuildText && c.name.toLowerCase().includes(WELCOME_CHANNEL_NAME)
  );
  if (wch) {
    await wch.send({ embeds: [embed] }).catch((err) => {
      writeLog('ERROR', `ส่งข้อความ welcome ไม่ได้ (#${wch.name}): ${err.message}`);
    });
    writeLog('WELCOME', `ช่อง #${wch.name} → ${member.user.tag}`);
  } else {
    const allTextChannels = guild.channels.cache
      .filter((c) => c.type === ChannelType.GuildText)
      .map((c) => c.name)
      .join(', ');
    writeLog('WARN', `หาช่องที่มีคำว่า "${WELCOME_CHANNEL_NAME}" ไม่เจอ → ${member.user.tag} | ช่องที่มีในเซิร์ฟเวอร์: ${allTextChannels}`);
  }
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

  // !setup-verify  (ระบบรับยศ)
  if (message.content === '!setup-verify') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator))
      return message.reply('❌ ต้องเป็น Admin ถึงจะใช้คำสั่งนี้ได้!');

    const vch = message.guild.channels.cache.find(
      (c) => c.name === VERIFY_CHANNEL_NAME && c.type === ChannelType.GuildText
    );
    if (!vch) return message.reply(`❌ หาช่อง #${VERIFY_CHANNEL_NAME} ไม่เจอ!`);

    const role = message.guild.roles.cache.find((r) => r.name === VERIFY_ROLE_NAME);
    if (!role) return message.reply(`❌ หายศ "${VERIFY_ROLE_NAME}" ไม่เจอ! สร้างยศนี้ในเซิร์ฟเวอร์ก่อนนะ`);

    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('✅ รับยศเพื่อยืนยันการเป็นสมาชิก')
      .setDescription(
        `สวัสดียินดีต้อนรับสู่ร้าน **MazaHub Space**\n\n` +
        `🇹🇭 : กดปุ่มด้านล่างเพื่อรับยศ **${VERIFY_ROLE_NAME}** และปลดล็อกช่องอื่นๆ\n` +
        `🇬🇧 : Press the button below to receive the **${VERIFY_ROLE_NAME}** role and unlock the rest of the server.\n` +
        `💬 discord.gg/Kxybtt6Ssa`
      )
      .setImage(BANNER_URL)
      .setFooter({ text: 'MazaHub Space • Powered by MazaHub Bot' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('get_role')
        .setLabel('✅ กดรับยศตรงนี้')
        .setStyle(ButtonStyle.Success),
    );

    await vch.send({ embeds: [embed], components: [row] });
    return message.reply('✅ วางปุ่มรับยศสำเร็จแล้ว!');
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
      const safeReply = matched.reply.length > 2000 ? matched.reply.slice(0, 1990) + '...' : matched.reply;
      await message.reply(safeReply);
      writeLog('REPLY', `keyword="${matchedKw}" | user=${message.author.tag}`);
    } catch (err) {
      writeLog('ERROR', `ส่งไม่ได้ (keyword="${matchedKw}", length=${matched.reply.length}): ${err.message}`);
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
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const ch = await createTicket(interaction.guild, interaction.member);
    if (ch) return interaction.editReply(`✅ เปิด Ticket แล้ว! → ${ch}`);
    return interaction.editReply('⚠️ คุณมี Ticket ที่เปิดอยู่แล้ว!');
  }

  if (interaction.customId === 'close_ticket') {
    if (!interaction.channel.name.startsWith('ticket-')) return;
    const numberMatch = interaction.channel.name.match(/-(\d{4})$/);
    const ticketNumberStr = numberMatch ? numberMatch[1] : '????';

    await interaction.reply('🔒 กำลังปิด Ticket... (3 วินาที)');
    await sendTicketLog(interaction.guild, 'close', interaction.user, ticketNumberStr);
    setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
    writeLog('TICKET', `ปิด → ${interaction.channel.name} | โดย ${interaction.user.tag} | #${ticketNumberStr}`);
  }

  // ปุ่มรับยศ
  if (interaction.customId === 'get_role') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const role = interaction.guild.roles.cache.find((r) => r.name === VERIFY_ROLE_NAME);
    if (!role) {
      writeLog('ERROR', `ไม่พบยศ "${VERIFY_ROLE_NAME}" ในเซิร์ฟเวอร์`);
      return interaction.editReply(`❌ ไม่พบยศ "${VERIFY_ROLE_NAME}" ในเซิร์ฟเวอร์ กรุณาติดต่อแอดมิน`);
    }

    if (interaction.member.roles.cache.has(role.id)) {
      return interaction.editReply('⚠️ คุณมียศนี้อยู่แล้ว!');
    }

    try {
      await interaction.member.roles.add(role);
      writeLog('VERIFY', `มอบยศ "${role.name}" → ${interaction.user.tag}`);
      return interaction.editReply(`✅ คุณได้รับยศ **${role.name}** เรียบร้อยแล้ว! ยินดีต้อนรับสู่ MazaHub Space 🔥`);
    } catch (err) {
      writeLog('ERROR', `มอบยศไม่สำเร็จ (${interaction.user.tag}): ${err.message}`);
      return interaction.editReply('❌ มอบยศไม่สำเร็จ บอทอาจไม่มีสิทธิ์จัดการยศนี้ (เช็คตำแหน่ง Role ของบอทให้สูงกว่ายศนี้)');
    }
  }
});

// ─────────────────────────────────────────
//  HELPER สร้าง Ticket
// ─────────────────────────────────────────
async function createTicket(guild, member) {
  const baseTicketName = `ticket-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const existing = guild.channels.cache.find((c) => c.name.startsWith(baseTicketName + '-'));
  if (existing) return null;

  const ticketNumber    = getNextTicketNumber();
  const ticketNumberStr = formatTicketNumber(ticketNumber);
  const ticketName      = `${baseTicketName}-${ticketNumberStr}`;

  const staffRole = guild.roles.cache.find((r) => r.name === STAFF_ROLE_NAME);
  const category  = guild.channels.cache.find(
    (c) => c.name.toLowerCase() === TICKET_CATEGORY_NAME && c.type === ChannelType.GuildCategory
  );

  const ticketCh = await guild.channels.create({
    name: ticketName,
    type: ChannelType.GuildText,
    topic: `Ticket #${ticketNumberStr} | เปิดโดย ${member.user.tag}`,
    parent: category || null,
    permissionOverwrites: [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      ...(staffRole ? [{ id: staffRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }] : []),
    ],
  });

  const embed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle(`🎫 Ticket #${ticketNumberStr} เปิดแล้ว!`)
    .setDescription(
      `สวัสดี ${member}! 👋\n\n` +
      `> 🇹🇭 : ทีมงาน **MazaHub Space** จะมาช่วยเร็วๆ นี้ 🔥\n` +
      `> 🇬🇧 : Our team will assist you shortly!\n` +
      `> อธิบายปัญหาหรือสิ่งที่ต้องการได้เลย!`
    )
    .setFooter({ text: `Ticket #${ticketNumberStr}` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('🔒 ปิด Ticket / Close Ticket')
      .setStyle(ButtonStyle.Danger),
  );

  await ticketCh.send({ content: `${member}`, embeds: [embed], components: [row] });
  await sendTicketLog(guild, 'open', member.user, ticketNumberStr);
  writeLog('TICKET', `เปิด → ${ticketCh.name} | ${member.user.tag} | #${ticketNumberStr}`);
  return ticketCh;
}

// ─────────────────────────────────────────
//  HELPER ส่ง Log การเปิด/ปิด Ticket ไปยังช่อง log
// ─────────────────────────────────────────
async function sendTicketLog(guild, action, user, ticketNumberStr) {
  const logCh = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name.toLowerCase().includes(TICKET_LOG_CHANNEL_NAME)
  );
  if (!logCh) {
    writeLog('WARN', `หาช่อง log ticket ("${TICKET_LOG_CHANNEL_NAME}") ไม่เจอ`);
    return;
  }

  const isOpen = action === 'open';
  const embed = new EmbedBuilder()
    .setColor(isOpen ? '#57F287' : '#ED4245')
    .setDescription(
      isOpen
        ? `🔹 **Ticket เปิดใหม่** — ${user.username} เปิด Ticket #${ticketNumberStr}`
        : `🔒 **Ticket ปิด** — ${user.username} ปิด Ticket #${ticketNumberStr}`
    )
    .setTimestamp();

  await logCh.send({ embeds: [embed] }).catch((err) => {
    writeLog('ERROR', `ส่ง ticket log ไม่ได้: ${err.message}`);
  });
}

client.on('error', (err) => writeLog('ERROR', err.message));
client.login(process.env.DISCORD_TOKEN || 'YOUR_BOT_TOKEN_HERE');
