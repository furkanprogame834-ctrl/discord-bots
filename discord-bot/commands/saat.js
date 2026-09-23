const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('saat')
    .setDescription('Guncel saati gosterir'),
  async execute(interaction) {
    const simdi = new Date();
    const options = { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const saat = simdi.toLocaleString('tr-TR', options);
    const tarih = simdi.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    await interaction.reply(`:clock3: **Saat:** ${saat}\n:calendar: **Tarih:** ${tarih}`);
  },
};
