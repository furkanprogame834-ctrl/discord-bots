const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadJson, saveJson, kumarDbPath } = require('./kumar-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kumarhane-islet')
    .setDescription('Kumarhaneni islet ve gelir kazan'),
  async execute(interaction) {
    const db = loadJson(kumarDbPath);
    const g = db[interaction.guild.id] || {};
    const simdi = Date.now();
    const birSaat = 60 * 60 * 1000;
    const son = g.sonGelir || 0;

    if (simdi - son < birSaat) {
      const kalanDk = Math.ceil((birSaat - (simdi - son)) / 60000);
      return interaction.reply({ content: `:clock1: Kumarhane yoruldu! Tekrar isletmek icin **${kalanDk}** dakika bekle`, ephemeral: true });
    }

    const gelir = Math.floor(Math.random() * 300) + 100;
    g.sonGelir = simdi;
    g.kasa = (g.kasa || 0) + gelir;
    db[interaction.guild.id] = g;
    saveJson(kumarDbPath, db);

    const embed = new EmbedBuilder()
      .setTitle(':slot_machine: Kumarhane Islendi!')
      .setDescription(`Kumarhane **${gelir} TL** gelir kazandi!\nKasa toplami: **${g.kasa} TL**`)
      .setColor(0x00FF00)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
