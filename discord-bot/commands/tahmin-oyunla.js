const { SlashCommandBuilder } = require('discord.js');
const { aktifOyunlar } = require('./tahmin.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tahmin-oyunla')
    .setDescription('Tahmin oyununda sayini gir')
    .addIntegerOption(opt => opt.setName('sayi').setDescription('Tahminin (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)),
  async execute(interaction) {
    const userId = interaction.user.id;
    const tahmin = interaction.options.getInteger('sayi');
    const aktif = aktifOyunlar[userId];

    if (!aktif) {
      return interaction.reply({ content: 'Once `/tahmin` ile bir oyun baslat!', ephemeral: true });
    }

    aktif.deneme += 1;

    if (tahmin === aktif.hedef) {
      const sure = Math.floor((Date.now() - aktif.baslangic) / 1000);
      delete aktifOyunlar[userId];

      return interaction.reply({
        embeds: [{
          color: 0x00FF00,
          title: ':tada: TEBRİKLER!',
          description: `Dogru sayi **${aktif.hedef}** idi!\n**${aktif.deneme}** denemede buldun.\nSure: **${sure}** saniye`,
          timestamp: new Date().toISOString(),
        }],
      });
    }

    const fark = tahmin > aktif.hedef ? 'Yuksek' : 'Dusuk';
    const uzaklik = Math.abs(tahmin - aktif.hedef);
    const ipucu = uzaklik <= 5 ? ' :fire: Cok yakin!' : uzaklik <= 15 ? ' :thermometer: Sicak!' : uzaklik <= 30 ? ' :cloud: Ilık' : ' :snowflake: Cok uzak';

    await interaction.reply({
      embeds: [{
        color: 0xFF0000,
        title: ':x: Yanlis!',
        description: `**${tahmin}** - ${fark}${ipucu}\nDeneme: **${aktif.deneme}**`,
        timestamp: new Date().toISOString(),
      }],
    });
  },
};
