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
//  ตั้งค่า — แก้ตรงนี้ได้เลย 🛠️
// ─────────────────────────────────────────
const WELCOME_CHANNEL_NAME = 'welcome';        // ชื่อช่อง welcome
const TICKET_CHANNEL_NAME  = 'create-ticket';  // ชื่อช่องที่วางปุ่ม ticket
const TICKET_CATEGORY_NAME = 'tickets';        // ชื่อ category สำหรับเก็บ ticket
const STAFF_ROLE_NAME      = 'Staff';          // ชื่อ role staff ที่จะเห็น ticket

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
//  WELCOME BOT
// ─────────────────────────────────────────
client.on('guildMemberAdd', async (member) => {
  const guild = member.guild;

  // Embed ต้อนรับ
  const welcomeEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('🔥 WELCOME TO MAZAHUB SPACE!')
    .setDescription(
      `> ยินดีต้อนรับ ${member} เข้าสู่ **MazaHub Space**! 🎉\n` +
      `> ร้านเปิด **24 ชั่วโมง** พร้อมให้บริการตลอดเวลา ⏰\n` +
      `> discord.gg/Kxybtt6Ssa`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setImage('attachment://banner.png')
    .setFooter({ text: `MazaHub Space • สมาชิกคนที่ ${guild.memberCount}` })
    .setTimestamp();

  // ส่งในช่อง #welcome
  const welcomeChannel = guild.channels.cache.find(
    (c) => c.name === WELCOME_CHANNEL_NAME && c.type === ChannelType.GuildText
  );
  if (welcomeChannel) {
    await welcomeChannel.send({ embeds: [welcomeEmbed] }).catch(() => {});
    writeLog('WELCOME', `ส่งในช่อง #welcome → ${member.user.tag}`);
  }

  // ส่ง DM
  const dmEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('🔥 ยินดีต้อนรับสู่ MazaHub Space!')
    .setDescription(
      `สวัสดี **${member.user.username}**! 👋\n\n` +
      `ขอบคุณที่เข้าร่วม **MazaHub Space**\n` +
      `> 🕐 ร้านเปิด **24 ชั่วโมง**\n` +
      `> 🎫 มีปัญหา? เปิด Ticket ได้เลย!\n` +
      `> 💬 discord.gg/Kxybtt6Ssa`
    )
    .setColor('#FF0000')
    .setTimestamp();

  await member.send({ embeds: [dmEmbed] }).catch(() => {
    writeLog('WARN', `ส่ง DM ไม่ได้ (ปิด DM) → ${member.user.tag}`);
  });
  writeLog('WELCOME', `ส่ง DM → ${member.user.tag}`);
});

// ─────────────────────────────────────────
//  TICKET SETUP COMMAND  !setup-ticket
// ─────────────────────────────────────────
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content !== '!setup-ticket') return;
  if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply('❌ ต้องเป็น Admin ถึงจะใช้คำสั่งนี้ได้!');
  }

  const ticketEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('🎫 MazaHub Space — Support Ticket')
    .setDescription(
      '> กดปุ่ม **เปิด Ticket** ด้านล่างเพื่อติดต่อทีมงาน\n' +
      '> หรือพิมพ์ `!ticket` ก็ได้เช่นกัน!\n\n' +
      '⏰ ทีมงานพร้อมให้บริการ **24 ชั่วโมง**'
    )
    .setFooter({ text: 'MazaHub Space' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('open_ticket')
      .setLabel('🎫 เปิด Ticket')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('🔒 ปิด Ticket')
      .setStyle(ButtonStyle.Secondary),
  );

  const ch = guild_channel(message.guild, TICKET_CHANNEL_NAME);
  if (ch) {
    await ch.send({ embeds: [ticketEmbed], components: [row] });
    message.reply('✅ วางปุ่ม Ticket สำเร็จแล้ว!');
  } else {
    message.reply(`❌ หาช่อง #${TICKET_CHANNEL_NAME} ไม่เจอ กรุณาสร้างช่องก่อน`);
  }
});

// ─────────────────────────────────────────
//  TICKET COMMAND  !ticket
// ─────────────────────────────────────────
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content !== '!ticket') return;
  await createTicket(message.guild, message.member);
  message.reply('✅ เปิด Ticket แล้ว! เช็คในหมวด Tickets ได้เลย 🎫');
});

// ─────────────────────────────────────────
//  BUTTON INTERACTION
// ─────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'open_ticket') {
    await interaction.deferReply({ ephemeral: true });
    const ch = await createTicket(interaction.guild, interaction.member);
    if (ch) {
      await interaction.editReply(`✅ เปิด Ticket แล้ว! → ${ch}`);
    } else {
      await interaction.editReply('⚠️ คุณมี Ticket ที่เปิดอยู่แล้ว!');
    }
  }

  if (interaction.customId === 'close_ticket') {
    if (!interaction.channel.name.startsWith('ticket-')) return;
    await interaction.reply('🔒 กำลังปิด Ticket...');
    setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
    writeLog('TICKET', `ปิด ticket → ${interaction.channel.name}`);
  }
});

// ─────────────────────────────────────────
//  HELPER — สร้าง Ticket Channel
// ─────────────────────────────────────────
async function createTicket(guild, member) {
  // เช็คว่ามี ticket อยู่แล้วไหม
  const existing = guild.channels.cache.find(
    (c) => c.name === `ticket-${member.user.username.toLowerCase().replace(/\s/g, '-')}`
  );
  if (existing) return null;

  const staffRole = guild.roles.cache.find((r) => r.name === STAFF_ROLE_NAME);
  const category  = guild.channels.cache.find(
    (c) => c.name.toLowerCase() === TICKET_CATEGORY_NAME && c.type === ChannelType.GuildCategory
  );

  const ticketChannel = await guild.channels.create({
    name: `ticket-${member.user.username.toLowerCase().replace(/\s/g, '-')}`,
    type: ChannelType.GuildText,
    parent: category || null,
    permissionOverwrites: [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      ...(staffRole ? [{ id: staffRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }] : []),
    ],
  });

  const ticketEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('🎫 Ticket เปิดแล้ว!')
    .setDescription(
      `สวัสดี ${member}!\n\n` +
      `> ทีมงาน **MazaHub Space** จะมาช่วยเร็วๆ นี้ 🔥\n` +
      `> กรุณาอธิบายปัญหาของคุณได้เลย\n\n` +
      `> กด **ปิด Ticket** เมื่อเสร็จสิ้น`
    )
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('🔒 ปิด Ticket')
      .setStyle(ButtonStyle.Danger),
  );

  await ticketChannel.send({ content: `${member}`, embeds: [ticketEmbed], components: [row] });
  writeLog('TICKET', `เปิด ticket → ${ticketChannel.name} | user=${member.user.tag}`);
  return ticketChannel;
}

function guild_channel(guild, name) {
  return guild.channels.cache.find((c) => c.name === name && c.type === ChannelType.GuildText);
}

client.once('ready', () => {
  writeLog('INFO', `MazaHub Bot ออนไลน์! → ${client.user.tag}`);
});

client.on('error', (err) => writeLog('ERROR', err.message));

client.login(process.env.DISCORD_TOKEN || 'YOUR_BOT_TOKEN_HERE');
