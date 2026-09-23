const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'giris-cikis-db.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giris-sayim')
    .setDescription('Son katilan ve ayrilan uyeleri gosterir')
    .addIntegerOption(opt => opt.setName('adet').setDescription('Kac kisi listelensin (1-20)').setMinValue(1).setMaxValue(20)),
  async execute(interaction) {
    let db = {};
    try { db = JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch {}
    const gid = interaction.guild.id;
    const adet = interaction.options.getInteger('adet') || 10;

    const giris = db[gid]?.katilan || [];
    const cikis = db[gid]?.ayrilan || [];

    if (giris.length === 0 && cikis.length === 0) {
      return interaction.reply({ content: ':grey_exclamation: Henuz giris/cikis kaydi yok. Bot kurulduktan sonra kaydedilir.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(':arrows_counterclockwise: Son Giris / Cikislar')
      .setColor(0x5865F2)
      .setTimestamp();

    embed.addFields({
      name: `:inbox_tray: Son Girisler (${giris.length})`,
      value: giris.slice(-adet).reverse().map(u => `<@${u.id}> — <t:${Math.floor(u.zaman / 1000)}:R>`).join('\n') || ':grey_exclamation: Kayit yok',
      inline: false,
    });
    embed.addFields({
      name: `:outbox_tray: Son Cikislar (${cikis.length})`,
      value: cikis.slice(-adet).reverse().map(u => `${u.isim} — <t:${Math.floor(u.zaman / 1000)}:R>`).join('\n') || ':grey_exclamation: Kayit yok',
      inline: false,
    });

    await interaction.reply({ embeds: [embed] });
  },
};
