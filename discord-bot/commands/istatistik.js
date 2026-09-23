const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { bakiyeAl, oyunSayisiAl } = require('./kumar-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('istatistik')
    .setDescription('Kullanici istatistiklerini gosterir (XP, seviye, mesaj, balans, kumar)')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Incelenecek kullanici (opsiyonel)')),
  async execute(interaction) {
    const hedef = interaction.options.getUser('kullanici') || interaction.user;

    const fs = require('fs');
    const path = require('path');

    const xpPath = path.join(__dirname, '..', '..', 'xp-db.json');
    let xp = {};
    try { if (fs.existsSync(xpPath)) xp = JSON.parse(fs.readFileSync(xpPath, 'utf8')); } catch (e) {}

    const uyeXp = xp[hedef.id] || {};

    const ticketPath = path.join(__dirname, '..', 'ticket-stats.json');
    let tickets = {};
    try { if (fs.existsSync(ticketPath)) tickets = JSON.parse(fs.readFileSync(ticketPath, 'utf8')); } catch (e) {}
    const uyeTicket = tickets[hedef.id] || {};

    const bakiye = bakiyeAl(hedef.id);
    const oyun = oyunSayisiAl(hedef.id);

    const uye = interaction.guild.members.cache.get(hedef.id);
    const katilma = uye ? uye.joinedTimestamp : null;

    const embed = new EmbedBuilder()
      .setTitle(`:bar_chart: ${hedef.username} - Istatistik`)
      .setThumbnail(hedef.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: ':level_slider: Seviye / XP', value: `Seviye ${uyeXp.level || 0} | ${uyeXp.xp || 0} XP`, inline: true },
        { name: ':speech_balloon: Mesaj', value: `${uyeXp.mesaj || 0}`, inline: true },
        { name: ':banknote: Bakiye', value: `${bakiye} TL`, inline: true },
        { name: ':game_die: Kumar Oyunu', value: `${oyun}`, inline: true },
        { name: ':tickets: Ticket', value: `${uyeTicket.acilan || 0} ac / ${uyeTicket.kapatilan || 0} kap`, inline: true },
        { name: ':calendar: Katilim', value: katilma ? `<t:${Math.floor(katilma / 1000)}:R>` : 'Bilinmiyor', inline: true },
      )
      .setColor(0x00BFFF)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
