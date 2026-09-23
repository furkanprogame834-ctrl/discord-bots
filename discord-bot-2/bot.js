require('dotenv').config();
const { Client, Collection, GatewayIntentBits, Events, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  }
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Bot aktif: ${readyClient.user.tag}`);
  readyClient.user.setActivity('Kingo bot | /sefer-baslat', { type: 3 });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isModalSubmit()) {
    try {
      const { handleModal } = require('./commands/sefer-form.js');
      const handled = await handleModal(interaction, client);
      if (handled) return;
    } catch (e) { console.error('Sefer modal hatasi:', e.message); }
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'siparis-sec') {
    try {
      const { handleSec } = require('./commands/siparis.js');
      await handleSec(interaction);
    } catch (e) { console.error('Siparis secim hatasi:', e.message); }
    return;
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'urun-sil-sec') {
    try {
      const { handleSec } = require('./commands/urun-sil.js');
      await handleSec(interaction);
    } catch (e) { console.error('Urun sil secim hatasi:', e.message); }
    return;
  }

  if (interaction.isButton()) {
    const btn = interaction.customId;

    if (btn === 'siparis-tamam') {
      try { const { handleTamam } = require('./commands/siparis.js'); await handleTamam(interaction); } catch (e) { console.error('Siparis tamam hatasi:', e.message); }
      return;
    }
    if (btn === 'siparis-iptal') {
      try { const { handleIptal } = require('./commands/siparis.js'); await handleIptal(interaction); } catch (e) { console.error('Siparis iptal hatasi:', e.message); }
      return;
    }
    if (btn.startsWith('siparis-panel-sec')) {
      try { const { handleSec } = require('./commands/siparis-panel.js'); await handleSec(interaction); } catch (e) { console.error('Panel secim hatasi:', e.message); }
      return;
    }
    if (btn === 'siparis-panel-onayla') {
      try { const { handleOnayla } = require('./commands/siparis-panel.js'); await handleOnayla(interaction); } catch (e) { console.error('Panel onay hatasi:', e.message); }
      return;
    }
    if (btn === 'siparis-panel-reddet') {
      try { const { handleReddet } = require('./commands/siparis-panel.js'); await handleReddet(interaction); } catch (e) { console.error('Panel red hatasi:', e.message); }
      return;
    }
    if (btn === 'siparis-panel-yeni') {
      try {
        const cmd = require('./commands/siparis-panel.js');
        await interaction.message.delete().catch(() => {});
        await cmd.execute(interaction);
      } catch (e) { console.error('Panel yenile hatasi:', e.message); }
      return;
    }
    if (btn === 'ticket-ac') {
      try {
        await interaction.deferReply({ flags: 64 });
        const ticketAc = require('./commands/ticket-ac.js');
        await ticketAc.createTicket(interaction.member, interaction.guild, interaction.channel, interaction);
      } catch (e) { console.error('Ticket ac hatasi:', e.message); }
      return;
    }
    if (btn === 'ticket-kapat') {
      try {
        const ticketKapat = require('./commands/ticket-kapat.js');
        await ticketKapat.execute(interaction);
      } catch (e) { console.error('Ticket kapat hatasi:', e.message); }
      return;
    }
    if (btn === 'ticket-sahiplen') {
      try {
        const { PermissionFlagsBits: PF, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        const fs = require('fs');
        const path = require('path');
        const loadJson = (p) => { try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {} return {}; };
        const kanal = interaction.channel;
        if (!kanal || !kanal.name.startsWith('ticket-')) {
          return interaction.reply({ content: 'Bu bir ticket kanali degil!', flags: 64 });
        }
        const destekRolId = (loadJson(path.join(__dirname, 'guild-config.json'))[interaction.guild.id] || {}).ticketRole;
        const destekRol = interaction.guild.roles.cache.get(destekRolId);
        const yetkili = interaction.member.permissions.has(PF.ManageChannels) ||
          (destekRol && interaction.member.roles.cache.has(destekRol.id));
        if (!yetkili) {
          return interaction.reply({ content: 'Bu ticketi sahiplenmek icin yetkin yok!', flags: 64 });
        }
        const sahipEmbed = new EmbedBuilder()
          .setColor(0x57F287)
          .setTitle(':ticket: Ticket Sahiplenildi')
          .setDescription(`:wrench: Bu ticket **${interaction.user}** tarafindan sahiplenildi.\n\nTalebi onun yonetecek. Yardim icin lutfen ona yazin.`)
          .setTimestamp();
        if (kanal.name.startsWith('ticket-')) {
          await kanal.setName(`calisiliyor-${interaction.user.username}`).catch(() => {});
        }
        await interaction.reply({ embeds: [sahipEmbed] });
        const kapatBtn = new ButtonBuilder()
          .setCustomId('ticket-kapat')
          .setLabel('Ticketi Kapat')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Danger);
        await interaction.followUp({ components: [new ActionRowBuilder().addComponents(kapatBtn)] }).catch(() => {});
      } catch (e) { console.error('Ticket sahiplen hatasi:', e.message); }
      return;
    }
  }

  if (interaction.isButton() && interaction.customId.startsWith('sefer-gonder_')) {
    try {
      const sff = require('./commands/sefer-form.js');
      const veri = (global.seferFormVeri || {})[interaction.user.id];
      if (!veri || !veri.v) {
        return interaction.reply({ content: '⚠️ Form verisi bulunamadı, lütfen yeniden doldur.', flags: 64 });
      }
      const hedef = interaction.guild.channels.cache.find(c => c.isTextBased() && c.name.includes(sff.TURE[veri.tur].kanal));
      if (!hedef) {
        return interaction.reply({ content: `⚠️ **${sff.TURE[veri.tur].kanal}** kanalı bulunamadı!`, flags: 64 });
      }
      let config = {};
      try {
        if (fs.existsSync(path.join(__dirname, 'guild-config.json'))) config = JSON.parse(fs.readFileSync(path.join(__dirname, 'guild-config.json'), 'utf8'));
      } catch (e) {}
      const taglar = (config[interaction.guild.id] || {}).seferTaglar || 'yok';
      const embed = sff.buildEmbed(sff.TURE[veri.tur], veri.v, taglar, interaction.user);
      await hedef.send({
        content: taglar === 'yok' ? undefined : taglar,
        embeds: [embed],
      });
      delete global.seferFormVeri[interaction.user.id];
      return interaction.reply({ content: `✅ ${sff.TURE[veri.tur].sembol} Form **${hedef}** kanalına gönderildi.`, flags: 64 });
    } catch (e) { console.error('Sefer gonder hatasi:', e.message); }
    return;
  }
  if (interaction.isButton() && interaction.customId === 'sefer-iptal') {
    try {
      if (global.seferFormVeri) delete global.seferFormVeri[interaction.user.id];
      return interaction.reply({ content: '❌ Form iptal edildi.', flags: 64 });
    } catch (e) { console.error('Sefer iptal hatasi:', e.message); }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'Komut calistirilirken hata olustu!', flags: 64 });
    } else {
      await interaction.reply({ content: 'Komut calistirilirken hata olustu!', flags: 64 });
    }
  }
});

client.on(Events.GuildMemberAdd, (member) => {
  try {
    const { uyeEkle } = require('./lib/kayit-db.js');
    const sonuc = uyeEkle(member.guild.id, member);
    if (sonuc.eklendi) {
      console.log(`Kayit: ${member.user.tag} (${member.guild.name}) -> toplam ${sonuc.sayi}`);
    }
  } catch (e) {
    console.error('Kayit hatasi:', e.message);
  }
});

process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection:', (err && err.message) || err);
});
process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', (err && err.stack) || err);
});
process.on('uncaughtExceptionMonitor', (err) => {
  console.error('uncaughtExceptionMonitor:', (err && err.message) || err);
});

let yenidenBaglaniyor = false;
client.on(Events.ShardDisconnect, (event, id) => {
  console.log(`Shard ${id} baglantisi koptu: ${event && event.code}`);
  if (yenidenBaglaniyor) return;
  yenidenBaglaniyor = true;
  setTimeout(() => { client.login(process.env.TOKEN).catch(() => {}); }, 5000);
});
client.on(Events.ShardReconnecting, (id) => {
  console.log(`Shard ${id} yeniden baglaniyor...`);
  yenidenBaglaniyor = false;
});

client.login(process.env.TOKEN);
