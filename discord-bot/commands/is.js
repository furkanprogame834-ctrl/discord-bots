const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { bakiyeAl, bakiyEkle, kumarYasakli } = require('./kumar-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('is')
    .setDescription('Kumarhanede calis ve para kazan'),
  async execute(interaction) {
    if (kumarYasakli(interaction.guild.id, interaction.user.id)) {
      return interaction.reply({ content: ':no_entry: Kumarhaneden yasaklandin!', ephemeral: true });
    }

    const { loadJson, saveJson, kumarDbPath } = require('./kumar-yardimci.js');
    const db = loadJson(kumarDbPath);
    const userId = interaction.user.id;
    const simdi = Date.now();
    const sonIs = db[userId]?.sonIs || 0;
    const birSaat = 60 * 60 * 1000;

    if (simdi - sonIs < birSaat) {
      const kalanDk = Math.ceil((birSaat - (simdi - sonIs)) / 60000);
      return interaction.reply({ content: `:clock1: Yorgunsun! Tekrar calismak icin **${kalanDk}** dakika bekle`, ephemeral: true });
    }

    const meslekler = ['Barmen', 'Kasiyer', 'Garson', 'Guvenlik', 'Ayak Takimi', 'Kapici', 'Odalik'];
    const meslek = meslekler[Math.floor(Math.random() * meslekler.length)];
    const kazanc = Math.floor(Math.random() * 150) + 50;

    bakiyEkle(userId, kazanc);

    if (!db[userId]) db[userId] = {};
    db[userId].sonIs = simdi;
    saveJson(kumarDbPath, db);

    const embed = new EmbedBuilder()
      .setTitle(':briefcase: Is Sahibi')
      .setDescription(`**${meslek}** olarak calistin!\n**+${kazanc} TL** kazandin!\nYeni bakiye: **${bakiyeAl(userId)} TL**`)
      .setColor(0x00BFFF)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
