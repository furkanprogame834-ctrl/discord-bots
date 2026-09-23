const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('temizle')
    .setDescription('Belirli sayida mesaj siler')
    .addIntegerOption(option =>
      option.setName('sayi').setDescription('Silinecek mesaj sayisi (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)
    ),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Mesajlari Yonet** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const sayi = interaction.options.getInteger('sayi');
    await interaction.channel.bulkDelete(sayi, true);
    await interaction.reply({ content: `:wastebasket: ${sayi} mesaj silindi!`, ephemeral: true });
  },
};
