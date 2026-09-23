const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { bakiyeAl, bakiyEkle, kumarYasakli } = require('./kumar-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('odul')
    .setDescription('Gunluk kumarhane odulunu al'),
  async execute(interaction) {
    if (kumarYasakli(interaction.guild.id, interaction.user.id)) {
      return interaction.reply({ content: ':no_entry: Kumarhaneden yasaklandin!', ephemeral: true });
    }

    const { loadJson, saveJson, kumarDbPath } = require('./kumar-yardimci.js');
    const db = loadJson(kumarDbPath);

    const userId = interaction.user.id;
    const simdi = Date.now();
    const sonOdul = db[userId]?.sonOdul || 0;
    const birGun = 24 * 60 * 60 * 1000;

    if (simdi - sonOdul < birGun) {
      const kalanSaat = Math.ceil((birGun - (simdi - sonOdul)) / 3600000);
      return interaction.reply({ content: `:clock1: Gunluk odulunu zaten aldin! Kalan sure: **${kalanSaat}** saat`, ephemeral: true });
    }

    const odul = Math.floor(Math.random() * 300) + 200;
    bakiyEkle(userId, odul);

    if (!db[userId]) db[userId] = {};
    db[userId].sonOdul = simdi;
    saveJson(kumarDbPath, db);

    const embed = new EmbedBuilder()
      .setTitle(':gift: Gunluk Odul!')
      .setDescription(`**+${odul} TL** kazandin!\nYeni bakiye: **${bakiyeAl(userId)} TL**`)
      .setColor(0xFFD700)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
