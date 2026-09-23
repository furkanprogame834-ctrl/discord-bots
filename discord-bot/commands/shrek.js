const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shrek')
    .setDescription('Shrek sana bir sey soyleyecek'),
  async execute(interaction) {
    const sozler = [
      'Bana inan, sen bir yıldızsın!',
      'Sen benim canımsın!',
      'Ben bir canavarım ama kalbim temiz!',
      'Soğanlar katman katmandır, tıpkı senin gibi!',
      'Bataklık hayatımın özüdür!',
      'Birisi mücadele etmeli!',
      'Bence sen özel birisin!',
      'Biraz Einstein gibi konuşayım mı?',
      'Hayat bataklık gibidir, yuzmeyi ogren!',
      'Dışarı çık, dünyayı kurtar!',
    ];
    const soz = sozler[Math.floor(Math.random() * sozler.length)];
    await interaction.reply(`:green_circle: **Shrek:** ${soz}`);
  },
};
