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
    keywords: ['fps', 'ยิงปืน'],
    reply: `-- [[ LOAD NEVERLOSE UI LIBRARY ]] --
local Library = loadstring(game:HttpGet("https://raw.githubusercontent.com/CludeHub/Can-You-Come-Back-To-Me/refs/heads/main/NEVERLOSE-CS2-SOURCE.lua"))()
local Window = Library:AddWindow("CludeHub", "rbxassetid://118608145176297", "Custom Script")

-- [[ SERVICES ]] --
local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer
local Camera = workspace.CurrentCamera
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")

-- [[ SETTINGS CONFIG ]] --
local Settings = {
    AimbotEnabled = false,
    WallCheck = true, -- true = ล็อกเฉพาะตัวที่ไม่มีอะไรบัง, false = ล็อกทะลุกำแพง
    ESPOutline = false,
    ESPLine = false
}

-- [[ UI SETUP (NEVERLOSE STYLE) ]] --
Window:AddTabLabel("Combat & Visuals")
local MainTab = Window:AddTab("Main Menu", "gear")

-- แบ่งฝั่งซ้าย (Aimbot) และ ฝั่งขวา (ESP)
local AimbotSection = MainTab:AddSection("AIMBOT SYSTEM", "left")
local ESPSection = MainTab:AddSection("ESP VISUALS", "right")

-- [ Elements: Aimbot Section ]
AimbotSection:AddToggle("Enable Aimbot", false, function(v)
    Settings.AimbotEnabled = v
end)

AimbotSection:AddDropdown("Aimbot Mode", {"Lock Visible Only", "Lock Through Wall"}, function(v)
    if v == "Lock Visible Only" then
        Settings.WallCheck = true
    elseif v == "Lock Through Wall" then
        Settings.WallCheck = false
    end
end)

-- [ Elements: ESP Section ]
ESPSection:AddToggle("ESP Outline", false, function(v)
    Settings.ESPOutline = v
end)

ESPSection:AddToggle("ESP Line", false, function(v)
    Settings.ESPLine = v
end)


-- [[ FUNCTION: MOUSE CONTROL (RIGHT ALT) ]] --
local mouseVisible = true
UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if input.KeyCode == Enum.KeyCode.RightAlt then
        mouseVisible = not mouseVisible
        UserInputService.MouseIconEnabled = mouseVisible
    end
end)


-- [[ CORE LOGIC: AIMBOT ]] --
local function isVisible(targetPart)
    if not Settings.WallCheck then return true end -- ถ้าสลับโหมดทะลุกำแพง ไม่ต้องเช็คสิ่งกีดขวาง
    
    local ignoreList = {LocalPlayer.Character, targetPart.Parent}
    local raycastParams = RaycastParams.new()
    raycastParams.FilterType = Enum.RaycastFilterType.Exclude
    raycastParams.FilterDescendantsInstances = ignoreList
    
    local direction = targetPart.Position - Camera.CFrame.Position
    local raycastResult = workspace:Raycast(Camera.CFrame.Position, direction, raycastParams)
    
    return raycastResult == nil
end

local function getClosestPlayer()
    local closestPlayer = nil
    local shortestDistance = math.huge

    for _, player in pairs(Players:GetPlayers()) do
        if player ~= LocalPlayer and player.Character and player.Character:FindFirstChild("HumanoidRootPart") and player.Character:FindFirstChild("Humanoid") and player.Character.Humanoid.Health > 0 then
            local hrp = player.Character.HumanoidRootPart
            local screenPos, onScreen = Camera:WorldToViewportPoint(hrp.Position)
            
            if onScreen and isVisible(hrp) then
                local mousePos = UserInputService:GetMouseLocation()
                local distance = (Vector2.new(screenPos.X, screenPos.Y) - mousePos).Magnitude
                
                if distance < shortestDistance then
                    closestPlayer = player
                    shortestDistance = distance
                end
            end
        end
    end
    return closestPlayer
end

-- ทำงานเมื่อเปิด Aimbot และ กดคลิกขวาค้าง (MouseButton2)
RunService.RenderStepped:Connect(function()
    if Settings.AimbotEnabled and UserInputService:IsMouseButtonPressed(Enum.UserInputType.MouseButton2) then
        local target = getClosestPlayer()
        if target and target.Character and target.Character:FindFirstChild("Head") then
            Camera.CFrame = CFrame.new(Camera.CFrame.Position, target.Character.Head.Position)
        end
    end
end)


-- [[ CORE LOGIC: ESP (LINE & OUTLINE) ]] --
local function createESP(player)
    -- สร้าง Line ESP (วาดด้วย Drawing)
    local line = Drawing.new("Line")
    line.Visible = false
    line.Color = Color3.fromRGB(255, 255, 255)
    line.Thickness = 1.5
    line.Transparency = 1

    -- สร้าง Outline ESP (ใช้ระบบ Highlight ของตัวละคร)
    local highlight = Instance.new("Highlight")
    highlight.Enabled = false
    highlight.FillTransparency = 1
    highlight.OutlineColor = Color3.fromRGB(255, 0, 50)
    highlight.OutlineTransparency = 0

    local function updateESP()
        local connection
        connection = RunService.RenderStepped:Connect(function()
            -- เคลียร์ขยะเมื่อผู้เล่นออกหรือตาย
            if not player.Parent or not player.Character then
                line.Visible = false
                highlight.Enabled = false
                if not player.Parent then
                    line:Remove()
                    highlight:Destroy()
                    connection:Disconnect()
                end
                return
            end

            local character = player.Character
            local hrp = character:FindFirstChild("HumanoidRootPart")
            
            -- บังคับใช้และอัปเดต Line ESP
            if Settings.ESPLine and hrp then
                local screenPos, onScreen = Camera:WorldToViewportPoint(hrp.Position)
                if onScreen then
                    line.From = Vector2.new(Camera.ViewportSize.X / 2, Camera.ViewportSize.Y) -- เริ่มจากกลางจอด้านล่าง
                    line.To = Vector2.new(screenPos.X, screenPos.Y)
                    line.Visible = true
                else
                    line.Visible = false
                end
            else
                line.Visible = false
            end

            -- บังคับใช้และอัปเดต Outline ESP
            if Settings.ESPOutline and character then
                if highlight.Parent ~= character then
                    highlight.Parent = character
                end
                highlight.Enabled = true
            else
                highlight.Enabled = false
            end
        end)
    end
    coroutine.wrap(updateESP)()
end

-- ค้นหาและรัน ESP ให้ผู้เล่นทุกคน
for _, p in pairs(Players:GetPlayers()) do
    if p ~= LocalPlayer then createESP(p) end
end
Players.PlayerAdded:Connect(function(p)
    if p ~= LocalPlayer then createESP(p) end
end)`
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
  } else {
    writeLog('WARN', `หาช่อง #${WELCOME_CHANNEL_NAME} ไม่เจอ → ${member.user.tag}`);
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

  // ปุ่มรับยศ
  if (interaction.customId === 'get_role') {
    await interaction.deferReply({ ephemeral: true });

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
