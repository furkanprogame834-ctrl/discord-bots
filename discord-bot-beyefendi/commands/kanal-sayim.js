const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'mesaj-sayim-db.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kanal-sayim')
    .setDescription('Kanallardaki mesaj sayisini gosterir')
    .addIntegerOption(opt => opt.setName('adet').setDescription('Kac kanal listelensin (1-15)').setMinValue(1).setMaxValue(15))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    let db = {};
    try { db = JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch {}
    const gid = interaction.guild.id;
    const adet = interaction.options.getInteger('adet') || 10;

    if (!db[gid] || Object.keys(db[gid].kanallar || {}).length === 0) {
      return interaction.reply({ content: ':grey_exclamation: Henuz mesaj sayimi kaydi yok.', ephemeral: true });
    }

    const siralama = Object.entries(db[gid].kanallar)
      .map(([id, sayi]) => ({ id, sayi }))
      .sort((a, b) => b.sayi - a.sayi)
      .slice(0, adet);

    const embed = new EmbedBuilder()
      .setTitle(':bar_chart: Kanallara Gore Mesaj Sayisi')
      .setColor(0x5865F2)
      .setTimestamp();

    siralama.forEach((k, i) => {
      const kanal = interaction.guild.channels.cache.get(k.id);
      const isim = kanal ? kanal.name : k.id;
      embed.addFields({ name: `${i + 1}. #${isim}`, value: `**${k.sayi}** mesaj`, inline: true });
    });

    await interaction.reply({ embeds: [embed] });
  },
};
