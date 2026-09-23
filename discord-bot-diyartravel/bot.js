require('dotenv').config();
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`HTTP sunucu ${PORT} portunda dinliyor (Render saglik kontrolu)`));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
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
  readyClient.user.setActivity('Diyartravel | /yardim', { type: 3 });
});

client.on(Events.InteractionCreate, async (interaction) => {
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

client.login(process.env.TOKEN);
