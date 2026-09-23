const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'mesaj-sayim-db.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sayim-mesaj')
    .setDescription('En cok mesaj atan uyeleri gosterir (bot kurulduktan sonra sayilir)')
    .addIntegerOption(opt => opt.setName('adet').setDescription('Kac kisi listelensin (1-10)').setMinValue(1).setMaxValue(10)),
  async execute(interaction) {
    let db = {};
    try { db = JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch {}
    const gid = interaction.guild.id;

    if (!db[gid] || Object.keys(db[gid].uyeler || {}).length === 0) {
      return interaction.reply({ content: ':grey_exclamation: Henuz mesaj sayimi kaydi yok. Bot kurulduktan sonra mesajlar sayilmaya baslar.', ephemeral: true });
    }

    const adet = interaction.options.getInteger('adet') || 10;

    const siralama = Object.entries(db[gid].uyeler)
      .map(([id, sayi]) => ({ id, sayi }))
      .sort((a, b) => b.sayi - a.sayi)
      .slice(0, adet);

    const embed = new EmbedBuilder()
      .setTitle(':bar_chart: En Aktif Uyeler (Mesaj Sayisi)')
      .setColor(0x57F287)
      .setTimestamp();

    const madalya = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];
    siralama.forEach((u, i) => {
      const kisi = interaction.client.users.cache.get(u.id);
      const isim = kisi ? kisi.username : u.id;
      const emoji = madalya[i] || `${i + 1}.`;
      embed.addFields({ name: `${emoji} ${isim}`, value: `**${u.sayi}** mesaj`, inline: true });
    });

    await interaction.reply({ embeds: [embed] });
  },
};
