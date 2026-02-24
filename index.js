require('dotenv').config();
const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, 
    ButtonStyle, PermissionFlagsBits, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers 
    ]
});

const BOT_TRIGGER = "jarvis"; 
const userXP = new Map();

client.on('ready', () => {
    console.log(`✅ Jarvis Ultimate : Tous les systèmes sont opérationnels.`);
});

// --- 1. BIENVENUE & XP ---
client.on('guildMemberAdd', async (m) => {
    const ch = m.guild.channels.cache.find(c => c.name.includes('bienvenue'));
    if (ch) {
        const eb = new EmbedBuilder()
            .setTitle("🧪 Nouveau sujet de test")
            .setThumbnail(m.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`Bienvenue ${m}. Le gâteau est un mensonge, mais votre test commence.`)
            .setColor("#f1c40f");
        ch.send({ embeds: [eb] });
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || message.content.toLowerCase().startsWith(BOT_TRIGGER)) return;
    let xp = userXP.get(message.author.id) || 0;
    userXP.set(message.author.id, xp + 10);
});

// --- 2. COMMANDES ---
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.toLowerCase().startsWith(BOT_TRIGGER)) return;
    const args = message.content.slice(BOT_TRIGGER.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // INITIALISATION MASSIVE
    if (command === 'initialisation') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        message.reply("🔄 **Construction du Centre...**");

        try {
            const staffRole = await message.guild.roles.create({ name: 'Personnel Scientifique', color: '#e74c3c' });
            const memberRole = await message.guild.roles.create({ name: 'Sujet de Test', color: '#3498db' });

            const catAcc = await message.guild.channels.create({ name: '🚀 ACCUEIL', type: ChannelType.GuildCategory });
            const chReg = await message.guild.channels.create({ name: '📑-règlement', parent: catAcc.id });
            await message.guild.channels.create({ name: '👋-bienvenue', parent: catAcc.id });
            await message.guild.channels.create({ name: '🎟️-tickets', parent: catAcc.id });

            const catChat = await message.guild.channels.create({ name: '💬 ZONE DE CHAT', type: ChannelType.GuildCategory });
            await message.guild.channels.create({ name: '💬-discussion', parent: catChat.id });
            await message.guild.channels.create({ name: '⭐-star-wars', parent: catChat.id });
            await message.guild.channels.create({ name: '⛩️-animé', parent: catChat.id });

            const catStaff = await message.guild.channels.create({ 
                name: '🕵️ SECTEUR STAFF', 
                type: ChannelType.GuildCategory,
                permissionOverwrites: [{ id: message.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, { id: staffRole.id, allow: [PermissionFlagsBits.ViewChannel] }]
            });
            await message.guild.channels.create({ name: '🛡️-discussion-staff', parent: catStaff.id });
            await message.guild.channels.create({ name: '🎤-vocal-staff', type: ChannelType.GuildVoice, parent: catStaff.id });

            const regEmbed = new EmbedBuilder()
                .setTitle("📜 RÈGLEMENT DU CENTRE")
                .setColor("#f1c40f")
                .setDescription("**1. Respect :** Courtoisie exigée.\n**2. Salons :** Respectez les thèmes.\n**3. Spam :** Interdit.\n\n👉 *Acceptez via le bouton ci-dessous.*");

            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('accept_rules').setLabel('Accepter').setStyle(ButtonStyle.Success));
            await chReg.send({ embeds: [regEmbed], components: [row] });

            message.channel.send("✅ **Architecture terminée.**");
        } catch (e) { console.error(e); }
    }

    // TICKETS, RANK & TOP
    if (command === 'setup') {
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('open_ticket').setLabel('Ouvrir un Ticket').setStyle(ButtonStyle.Primary));
        const eb = new EmbedBuilder().setTitle("🎫 Assistance").setDescription("Cliquez pour de l'aide.").setColor("#3498db");
        message.channel.send({ embeds: [eb], components: [row] });
    }

    if (command === 'rank' || command === 'ranch') {
        const xp = userXP.get(message.author.id) || 0;
        message.reply(`📊 Vous avez **${xp} XP**.`);
    }

    if (command === 'top') {
        const sorted = Array.from(userXP.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const eb = new EmbedBuilder().setTitle("🏆 Top Sujets").setDescription(sorted.map((u, i) => `${i+1}. <@${u[0]}> - ${u[1]} XP`).join("\n") || "Vide.");
        message.channel.send({ embeds: [eb] });
    }
});

// --- 3. INTERACTIONS ---
client.on('interactionCreate', async (i) => {
    if (i.isButton() && i.customId === 'accept_rules') {
        const role = i.guild.roles.cache.find(r => r.name.includes('Sujet'));
        if (role) await i.member.roles.add(role);
        return i.reply({ content: "Accès autorisé.", ephemeral: true });
    }

    if (i.isButton() && i.customId === 'open_ticket') {
        const ch = await i.guild.channels.create({
            name: `ticket-${i.user.username}`,
            permissionOverwrites: [{ id: i.guild.id, deny: [PermissionFlagsBits.ViewChannel] }, { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel] }]
        });
        return i.reply({ content: `✅ Ticket ouvert : ${ch}`, ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);