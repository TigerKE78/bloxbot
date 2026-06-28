const {
  Client, GatewayIntentBits, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelType, PermissionFlagsBits, MessageFlags,
  AuditLogEvent
} = require('discord.js');
const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────
//  LOG SYSTEM
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

// ─ ตัวนับเลข Ticket ─
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
//  ตั้งค่าระบบ (SETTINGS)
// ─────────────────────────────────────────
const WELCOME_CHANNEL_NAME    = 'welcome';
const TICKET_CHANNEL_NAME     = 'create-ticket';
const TICKET_CATEGORY_NAME    = 'tickets';
const TICKET_LOG_CHANNEL_NAME = 'ticket-logs';
const STAFF_ROLE_NAME         = 'Staff';
const ALLOWED_CHANNEL_IDS     = [];

const VERIFY_CHANNEL_NAME = 'verify';
const VERIFY_ROLE_NAME    = 'Verified';

// ── ชื่อช่อง Audit Log (สร้างช่องนี้ในดิสก่อน) ──
const AUDIT_LOG_CHANNEL_NAME = 'audit-logs';

const BANNER_URL = 'https://cdn.discordapp.com/attachments/1479847528307621918/1516321299415302184/file_000000006578722fa3c391908e90605e.jpg';

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
    keywords: ['fps', 'ยิงปืน'],
    reply: ` loadstring(game:HttpGet('https://pastebin.com/raw/jfJTWzMr'))() `
  },
];

// ─────────────────────────────────────────
//  CLIENT INITIALIZATION
// ─────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,   // ← ต้องการสำหรับ voice move
    GatewayIntentBits.MessageContent,
  ],
});

// ─────────────────────────────────────────
//  HELPER: ส่ง AUDIT LOG EMBED
// ─────────────────────────────────────────
async function sendAuditLog(guild, embed) {
  const ch = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText &&
           c.name.toLowerCase() === AUDIT_LOG_CHANNEL_NAME.toLowerCase()
  );
  if (!ch) return;
  await ch.send({ embeds: [embed] }).catch((err) =>
    writeLog('ERROR', `ส่ง audit log ไม่ได้: ${err.message}`)
  );
}

// ── delay เล็กน้อยเพื่อรอ Discord Audit Log อัปเดต ──
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────
//  EVENT: READY
// ─────────────────────────────────────────
client.once('clientReady', (c) => {
  writeLog('INFO', `MazaHub Bot ออนไลน์! → ${c.user.tag}`);
});

// ─────────────────────────────────────────
//  EVENT: GUILD MEMBER ADD (ต้อนรับสมาชิกใหม่)
// ─────────────────────────────────────────
client.on('guildMemberAdd', async (member) => {
  const guild = member.guild;
  const wch = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name.toLowerCase().includes(WELCOME_CHANNEL_NAME)
  );

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

  if (wch) {
    await wch.send({ embeds: [embed] }).catch((err) =>
      writeLog('ERROR', `ส่ง welcome ไม่ได้: ${err.message}`)
    );
    writeLog('WELCOME', `#${wch.name} → ${member.user.tag}`);
  }
});

// ═══════════════════════════════════════════════════════════════
//  ██████████  AUDIT LOG EVENTS  ██████████
// ═══════════════════════════════════════════════════════════════

// ─── 1. สมาชิกถูก KICK ───
client.on('guildMemberRemove', async (member) => {
  await sleep(1000);
  const audit = await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 1 }).catch(() => null);
  const entry = audit?.entries.first();
  if (!entry || entry.target?.id !== member.id) return;
  if (Date.now() - entry.createdTimestamp > 5000) return;

  const embed = new EmbedBuilder()
    .setColor('#FF6B35')
    .setTitle('👢 สมาชิกถูก Kick')
    .addFields(
      { name: 'ผู้ถูก Kick', value: `${member.user.tag} (${member.id})`, inline: true },
      { name: 'โดย', value: `${entry.executor?.tag ?? 'ไม่ทราบ'}`, inline: true },
      { name: 'เหตุผล', value: entry.reason ?? 'ไม่ระบุ' }
    )
    .setThumbnail(member.user.displayAvatarURL())
    .setTimestamp();

  await sendAuditLog(member.guild, embed);
  writeLog('AUDIT', `KICK | ${member.user.tag} | โดย ${entry.executor?.tag}`);
});

// ─── 2. สมาชิกถูก BAN ───
client.on('guildBanAdd', async (ban) => {
  await sleep(1000);
  const audit = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 }).catch(() => null);
  const entry = audit?.entries.first();

  const embed = new EmbedBuilder()
    .setColor('#ED4245')
    .setTitle('🔨 สมาชิกถูก Ban')
    .addFields(
      { name: 'ผู้ถูก Ban', value: `${ban.user.tag} (${ban.user.id})`, inline: true },
      { name: 'โดย', value: `${entry?.executor?.tag ?? 'ไม่ทราบ'}`, inline: true },
      { name: 'เหตุผล', value: entry?.reason ?? ban.reason ?? 'ไม่ระบุ' }
    )
    .setThumbnail(ban.user.displayAvatarURL())
    .setTimestamp();

  await sendAuditLog(ban.guild, embed);
  writeLog('AUDIT', `BAN | ${ban.user.tag} | โดย ${entry?.executor?.tag}`);
});

// ─── 3. สมาชิกถูก UNBAN ───
client.on('guildBanRemove', async (ban) => {
  await sleep(1000);
  const audit = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 1 }).catch(() => null);
  const entry = audit?.entries.first();

  const embed = new EmbedBuilder()
    .setColor('#57F287')
    .setTitle('✅ สมาชิกถูก Unban')
    .addFields(
      { name: 'ผู้ถูก Unban', value: `${ban.user.tag} (${ban.user.id})`, inline: true },
      { name: 'โดย', value: `${entry?.executor?.tag ?? 'ไม่ทราบ'}`, inline: true }
    )
    .setThumbnail(ban.user.displayAvatarURL())
    .setTimestamp();

  await sendAuditLog(ban.guild, embed);
  writeLog('AUDIT', `UNBAN | ${ban.user.tag} | โดย ${entry?.executor?.tag}`);
});

// ─── 4. อัปเดต Role ของสมาชิก (เพิ่ม/เอายศออก) + Timeout + Mute ───
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  await sleep(1000);

  // ── ตรวจ Role เปลี่ยน ──
  const addedRoles   = newMember.roles.cache.filter((r) => !oldMember.roles.cache.has(r.id));
  const removedRoles = oldMember.roles.cache.filter((r) => !newMember.roles.cache.has(r.id));

  if (addedRoles.size > 0 || removedRoles.size > 0) {
    const audit = await newMember.guild.fetchAuditLogs({ type: AuditLogEvent.MemberRoleUpdate, limit: 1 }).catch(() => null);
    const entry = audit?.entries.first();

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🏷️ ยศสมาชิกเปลี่ยน')
      .addFields(
        { name: 'สมาชิก', value: `${newMember.user.tag} (${newMember.id})`, inline: true },
        { name: 'โดย', value: `${entry?.executor?.tag ?? 'ไม่ทราบ'}`, inline: true }
      )
      .setThumbnail(newMember.user.displayAvatarURL())
      .setTimestamp();

    if (addedRoles.size > 0)
      embed.addFields({ name: '✅ เพิ่มยศ', value: addedRoles.map((r) => r.name).join(', ') });
    if (removedRoles.size > 0)
      embed.addFields({ name: '❌ เอายศออก', value: removedRoles.map((r) => r.name).join(', ') });

    await sendAuditLog(newMember.guild, embed);
    writeLog('AUDIT', `ROLE UPDATE | ${newMember.user.tag} | +[${[...addedRoles.values()].map(r=>r.name)}] -[${[...removedRoles.values()].map(r=>r.name)}]`);
  }

  // ── ตรวจ Timeout ──
  const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
  const newTimeout = newMember.communicationDisabledUntilTimestamp;
  if (oldTimeout !== newTimeout) {
    const audit = await newMember.guild.fetchAuditLogs({ type: AuditLogEvent.MemberUpdate, limit: 1 }).catch(() => null);
    const entry = audit?.entries.first();
    const isTimedOut = newTimeout && newTimeout > Date.now();

    const embed = new EmbedBuilder()
      .setColor(isTimedOut ? '#FEE75C' : '#57F287')
      .setTitle(isTimedOut ? '⏳ สมาชิกถูก Timeout' : '✅ ยกเลิก Timeout')
      .addFields(
        { name: 'สมาชิก', value: `${newMember.user.tag} (${newMember.id})`, inline: true },
        { name: 'โดย', value: `${entry?.executor?.tag ?? 'ไม่ทราบ'}`, inline: true },
        ...(isTimedOut ? [{ name: 'หมดเวลา', value: `<t:${Math.floor(newTimeout / 1000)}:R>` }] : []),
        { name: 'เหตุผล', value: entry?.reason ?? 'ไม่ระบุ' }
      )
      .setThumbnail(newMember.user.displayAvatarURL())
      .setTimestamp();

    await sendAuditLog(newMember.guild, embed);
    writeLog('AUDIT', `TIMEOUT | ${newMember.user.tag} | ${isTimedOut ? 'ถูก timeout' : 'ยกเลิก'}`);
  }

  // ── ตรวจ Nickname เปลี่ยน ──
  if (oldMember.nickname !== newMember.nickname) {
    const embed = new EmbedBuilder()
      .setColor('#EB459E')
      .setTitle('✏️ Nickname เปลี่ยน')
      .addFields(
        { name: 'สมาชิก', value: `${newMember.user.tag}`, inline: true },
        { name: 'เดิม', value: oldMember.nickname ?? '*(ไม่มี)*', inline: true },
        { name: 'ใหม่', value: newMember.nickname ?? '*(ไม่มี)*', inline: true }
      )
      .setTimestamp();

    await sendAuditLog(newMember.guild, embed);
    writeLog('AUDIT', `NICKNAME | ${newMember.user.tag} | "${oldMember.nickname}" → "${newMember.nickname}"`);
  }
});

// ─── 5. Voice State: Mute / Deafen / ย้ายห้อง voice ───
client.on('voiceStateUpdate', async (oldState, newState) => {
  await sleep(1500); // เพิ่ม delay ให้ Discord Audit Log อัปเดตทัน
  const guild  = newState.guild;
  const member = newState.member;
  if (!member) return;

  // ── ย้ายห้อง Voice (ทั้งย้ายเอง และถูกย้ายโดย Admin) ──
  if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
    const audit = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberMove, limit: 5 }).catch(() => null);

    // หา entry ที่ตรงกับ member คนนี้ และเพิ่งเกิดขึ้น (ภายใน 10 วินาที)
    const entry = audit?.entries.find(
      (e) => e.target?.id === member.id && Date.now() - e.createdTimestamp < 10000
    ) ?? audit?.entries.find(
      (e) => Date.now() - e.createdTimestamp < 10000
    );

    const movedBy = entry?.executor?.tag ?? 'ไม่ทราบ';
    const isSelfMove = !entry || entry.executor?.id === member.id;

    const embed = new EmbedBuilder()
      .setColor('#9B59B6')
      .setTitle(isSelfMove ? '🔀 ย้ายห้อง Voice (ด้วยตัวเอง)' : '🔀 ถูกย้ายห้อง Voice')
      .addFields(
        { name: 'สมาชิก', value: `${member.user.tag}`, inline: true },
        { name: 'โดย', value: movedBy, inline: true },
        { name: 'จากห้อง', value: `${oldState.channel?.name ?? '?'}`, inline: true },
        { name: 'ไปห้อง', value: `${newState.channel?.name ?? '?'}`, inline: true }
      )
      .setTimestamp();

    await sendAuditLog(guild, embed);
    writeLog('AUDIT', `VOICE MOVE | ${member.user.tag} | ${oldState.channel?.name} → ${newState.channel?.name} | โดย ${movedBy}`);
  }

  // ── เข้า Voice ──
  if (!oldState.channelId && newState.channelId) {
    const embed = new EmbedBuilder()
      .setColor('#57F287')
      .setTitle('🎙️ เข้าห้อง Voice')
      .addFields(
        { name: 'สมาชิก', value: `${member.user.tag}`, inline: true },
        { name: 'ห้อง', value: `${newState.channel?.name}`, inline: true }
      )
      .setTimestamp();
    await sendAuditLog(guild, embed);
  }

  // ── ออกจาก Voice ──
  if (oldState.channelId && !newState.channelId) {
    const embed = new EmbedBuilder()
      .setColor('#ED4245')
      .setTitle('🔇 ออกจากห้อง Voice')
      .addFields(
        { name: 'สมาชิก', value: `${member.user.tag}`, inline: true },
        { name: 'ห้อง', value: `${oldState.channel?.name}`, inline: true }
      )
      .setTimestamp();
    await sendAuditLog(guild, embed);
  }

  // ── Server Mute ──
  if (!oldState.serverMute && newState.serverMute) {
    const audit = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberUpdate, limit: 1 }).catch(() => null);
    const entry = audit?.entries.first();
    const embed = new EmbedBuilder()
      .setColor('#FEE75C')
      .setTitle('🔇 ปิดไมค์ (Server Mute)')
      .addFields(
        { name: 'สมาชิก', value: `${member.user.tag}`, inline: true },
        { name: 'โดย', value: `${entry?.executor?.tag ?? 'ไม่ทราบ'}`, inline: true }
      )
      .setTimestamp();
    await sendAuditLog(guild, embed);
    writeLog('AUDIT', `SERVER MUTE | ${member.user.tag}`);
  }

  if (oldState.serverMute && !newState.serverMute) {
    const embed = new EmbedBuilder()
      .setColor('#57F287')
      .setTitle('🎙️ เปิดไมค์ (Server Unmute)')
      .addFields({ name: 'สมาชิก', value: `${member.user.tag}`, inline: true })
      .setTimestamp();
    await sendAuditLog(guild, embed);
  }

  // ── Server Deafen ──
  if (!oldState.serverDeaf && newState.serverDeaf) {
    const embed = new EmbedBuilder()
      .setColor('#FEE75C')
      .setTitle('🙉 ปิดหูฟัง (Server Deafen)')
      .addFields({ name: 'สมาชิก', value: `${member.user.tag}`, inline: true })
      .setTimestamp();
    await sendAuditLog(guild, embed);
  }
});

// ─── 6. สร้างห้อง / ลบห้อง / แก้ชื่อห้อง ───
client.on('channelCreate', async (channel) => {
  if (!channel.guild) return;
  await sleep(1000);
  const audit = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate, limit: 1 }).catch(() => null);
  const entry = audit?.entries.first();

  const embed = new EmbedBuilder()
    .setColor('#57F287')
    .setTitle('📁 สร้างห้องใหม่')
    .addFields(
      { name: 'ชื่อห้อง', value: `#${channel.name}`, inline: true },
      { name: 'ประเภท', value: `${channel.type}`, inline: true },
      { name: 'โดย', value: `${entry?.executor?.tag ?? 'ไม่ทราบ'}`, inline: true }
    )
    .setTimestamp();

  await sendAuditLog(channel.guild, embed);
  writeLog('AUDIT', `CHANNEL CREATE | #${channel.name} | โดย ${entry?.executor?.tag}`);
});

client.on('channelDelete', async (channel) => {
  if (!channel.guild) return;
  await sleep(1000);
  const audit = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 }).catch(() => null);
  const entry = audit?.entries.first();

  const embed = new EmbedBuilder()
    .setColor('#ED4245')
    .setTitle('🗑️ ลบห้อง')
    .addFields(
      { name: 'ชื่อห้อง', value: `#${channel.name}`, inline: true },
      { name: 'โดย', value: `${entry?.executor?.tag ?? 'ไม่ทราบ'}`, inline: true }
    )
    .setTimestamp();

  await sendAuditLog(channel.guild, embed);
  writeLog('AUDIT', `CHANNEL DELETE | #${channel.name} | โดย ${entry?.executor?.tag}`);
});

client.on('channelUpdate', async (oldChannel, newChannel) => {
  if (!newChannel.guild) return;
  if (oldChannel.name === newChannel.name) return; // กรองเฉพาะเปลี่ยนชื่อ

  await sleep(1000);
  const audit = await newChannel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelUpdate, limit: 1 }).catch(() => null);
  const entry = audit?.entries.first();

  const embed = new EmbedBuilder()
    .setColor('#EB459E')
    .setTitle('✏️ เปลี่ยนชื่อห้อง')
    .addFields(
      { name: 'ชื่อเดิม', value: `#${oldChannel.name}`, inline: true },
      { name: 'ชื่อใหม่', value: `#${newChannel.name}`, inline: true },
      { name: 'โดย', value: `${entry?.executor?.tag ?? 'ไม่ทราบ'}`, inline: true }
    )
    .setTimestamp();

  await sendAuditLog(newChannel.guild, embed);
  writeLog('AUDIT', `CHANNEL RENAME | #${oldChannel.name} → #${newChannel.name} | โดย ${entry?.executor?.tag}`);
});

// ─── 7. Role สร้างใหม่ / ลบ ───
client.on('roleCreate', async (role) => {
  await sleep(1000);
  const audit = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleCreate, limit: 1 }).catch(() => null);
  const entry = audit?.entries.first();

  const embed = new EmbedBuilder()
    .setColor('#57F287')
    .setTitle('🆕 สร้างยศใหม่')
    .addFields(
      { name: 'ชื่อยศ', value: role.name, inline: true },
      { name: 'โดย', value: `${entry?.executor?.tag ?? 'ไม่ทราบ'}`, inline: true }
    )
    .setTimestamp();

  await sendAuditLog(role.guild, embed);
  writeLog('AUDIT', `ROLE CREATE | ${role.name} | โดย ${entry?.executor?.tag}`);
});

client.on('roleDelete', async (role) => {
  await sleep(1000);
  const audit = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 }).catch(() => null);
  const entry = audit?.entries.first();

  const embed = new EmbedBuilder()
    .setColor('#ED4245')
    .setTitle('🗑️ ลบยศ')
    .addFields(
      { name: 'ชื่อยศ', value: role.name, inline: true },
      { name: 'โดย', value: `${entry?.executor?.tag ?? 'ไม่ทราบ'}`, inline: true }
    )
    .setTimestamp();

  await sendAuditLog(role.guild, embed);
  writeLog('AUDIT', `ROLE DELETE | ${role.name} | โดย ${entry?.executor?.tag}`);
});

// ═══════════════════════════════════════════════════════════════
//  EVENT: MESSAGE CREATE
// ═══════════════════════════════════════════════════════════════
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const content = message.content.toLowerCase().trim();

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
      new ButtonBuilder().setCustomId('open_ticket').setLabel('🎫 Open a ticket!').setStyle(ButtonStyle.Danger),
    );

    await tch.send({ embeds: [embed], components: [row] });
    return message.reply('✅ วางปุ่ม Ticket สำเร็จแล้ว!');
  }

  if (message.content === '!setup-verify') {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator))
      return message.reply('❌ ต้องเป็น Admin ถึงจะใช้คำสั่งนี้ได้!');

    const vch = message.guild.channels.cache.find(
      (c) => c.name === VERIFY_CHANNEL_NAME && c.type === ChannelType.GuildText
    );
    if (!vch) return message.reply(`❌ หาช่อง #${VERIFY_CHANNEL_NAME} ไม่เจอ!`);

    const role = message.guild.roles.cache.find((r) => r.name === VERIFY_ROLE_NAME);
    if (!role) return message.reply(`❌ หายศ "${VERIFY_ROLE_NAME}" ไม่เจอ!`);

    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('✅ รับยศเพื่อยืนยันการเป็นสมาชิก')
      .setDescription(
        `สวัสดียินดีต้อนรับสู่ร้าน **MazaHub Space**\n\n` +
        `🇹🇭 : กดปุ่มด้านล่างเพื่อรับยศ **${VERIFY_ROLE_NAME}**\n` +
        `🇬🇧 : Press the button below to receive the **${VERIFY_ROLE_NAME}** role.\n` +
        `💬 discord.gg/Kxybtt6Ssa`
      )
      .setImage(BANNER_URL)
      .setFooter({ text: 'MazaHub Space • Powered by MazaHub Bot' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('get_role').setLabel('✅ กดรับยศตรงนี้').setStyle(ButtonStyle.Success),
    );

    await vch.send({ embeds: [embed], components: [row] });
    return message.reply('✅ วางปุ่มรับยศสำเร็จแล้ว!');
  }

  if (message.content === '!ticket') {
    const ch = await createTicket(message.guild, message.member);
    if (ch) return message.reply(`✅ เปิด Ticket แล้ว! → ${ch}`);
    return message.reply('⚠️ คุณมี Ticket ที่เปิดอยู่แล้ว!');
  }

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
      writeLog('ERROR', `ส่งไม่ได้ (keyword="${matchedKw}"): ${err.message}`);
    }
  }
});

// ─────────────────────────────────────────
//  EVENT: INTERACTION CREATE
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

    await sendTicketLog(interaction.guild, 'close', interaction.user, ticketNumberStr);
    await interaction.reply('🔒 กำลังปิด Ticket... (3 วินาที)');
    setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
    writeLog('TICKET', `ปิด → ${interaction.channel.name} | โดย ${interaction.user.tag}`);
  }

  if (interaction.customId === 'get_role') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const role = interaction.guild.roles.cache.find((r) => r.name === VERIFY_ROLE_NAME);
    if (!role) return interaction.editReply(`❌ ไม่พบยศ "${VERIFY_ROLE_NAME}"`);
    if (interaction.member.roles.cache.has(role.id)) return interaction.editReply('⚠️ คุณมียศนี้อยู่แล้ว!');

    try {
      await interaction.member.roles.add(role);
      writeLog('VERIFY', `มอบยศ "${role.name}" → ${interaction.user.tag}`);
      return interaction.editReply(`✅ คุณได้รับยศ **${role.name}** เรียบร้อยแล้ว!`);
    } catch (err) {
      writeLog('ERROR', `มอบยศไม่สำเร็จ: ${err.message}`);
      return interaction.editReply('❌ มอบยศไม่สำเร็จ เช็คสิทธิ์บอทด้วย');
    }
  }
});

// ─────────────────────────────────────────
//  FUNCTION: สร้าง TICKET
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
    new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 ปิด Ticket / Close Ticket').setStyle(ButtonStyle.Danger),
  );

  await ticketCh.send({ content: `${member}`, embeds: [embed], components: [row] });
  await sendTicketLog(guild, 'open', member.user, ticketNumberStr);
  writeLog('TICKET', `เปิด → ${ticketCh.name} | ${member.user.tag} | #${ticketNumberStr}`);
  return ticketCh;
}

// ─────────────────────────────────────────
//  FUNCTION: ส่ง LOG TICKET
// ─────────────────────────────────────────
async function sendTicketLog(guild, action, user, ticketNumberStr) {
  const logCh = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name.toLowerCase() === TICKET_LOG_CHANNEL_NAME.toLowerCase()
  );
  if (!logCh) return writeLog('WARN', `หาช่อง "${TICKET_LOG_CHANNEL_NAME}" ไม่เจอ`);

  const isOpen = action === 'open';
  const embed = new EmbedBuilder()
    .setColor(isOpen ? '#57F287' : '#ED4245')
    .setDescription(
      isOpen
        ? `🔹 **Ticket เปิดใหม่** — ${user.username} เปิด Ticket #${ticketNumberStr}`
        : `🔒 **Ticket ปิด** — ${user.username} ปิด Ticket #${ticketNumberStr}`
    )
    .setTimestamp();

  await logCh.send({ embeds: [embed] }).catch((err) =>
    writeLog('ERROR', `ส่ง ticket log ไม่ได้: ${err.message}`)
  );
}

client.on('error', (err) => writeLog('ERROR', err.message));
client.login(process.env.DISCORD_TOKEN || 'YOUR_BOT_TOKEN_HERE');
