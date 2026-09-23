const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { bakiyEkle, kumarYasakli } = require('./kumar-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kazandiran')
    .setDescription('Sans talisi - rastgele buyuk odul al'),
  async execute(interaction) {
    if (kumarYasakli(interaction.guild.id, interaction.user.id)) {
      return interaction.reply({ content: ':no_entry: Kumarhaneden yasaklandin!', ephemeral: true });
    }

    const { loadJson, saveJson, kumarDbPath } = require('./kumar-yardimci.js');
    const db = loadJson(kumarDbPath);
    const userId = interaction.user.id;
    const simdi = Date.now();
    const birGun = 24 * 60 * 60 * 1000;
    const son = db[userId]?.talih || 0;

    if (simdi - son < birGun) {
      const kalanSaat = Math.ceil((birGun - (simdi - son)) / 3600000);
      return interaction.reply({ content: `:clock1: Sans talisi gunluk 1 kere! Kalan sure: **${kalanSaat}** saat`, ephemeral: true });
    }

    const sans = Math.random();
    let odul = 0;
    let mesaj = '';

    if (sans < 0.01) { odul = 10000; mesaj = ':fire: **BUYUK JACKPOT!** 10000 TL!'; }
    else if (sans < 0.05) { odul = 1000; mesaj = ':star2: Muhtesem! 1000 TL!'; }
    else if (sans < 0.2) { odul = 200; mesaj = ':smile: Guzel! 200 TL!'; }
    else if (sans < 0.5) { odul = 50; mesaj = ':blush: Iyi! 50 TL!'; }
    else { odul = 10; mesaj = ':neutral_face: Az da olsa... 10 TL!'; }

    bakiyEkle(userId, odul);

    if (!db[userId]) db[userId] = {};
    db[userId].talih = simdi;
    saveJson(kumarDbPath, db);

    const { bakiyeAl } = require('./kumar-yardimci.js');

    const embed = new EmbedBuilder()
      .setTitle(':sparkles: Sans Talisi!')
      .setDescription(`**${mesaj}**\nYeni bakiye: **${bakiyeAl(userId)} TL**`)
      .setColor(0xFFD700)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
