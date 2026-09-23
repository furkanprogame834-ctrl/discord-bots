const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('temizle-bot')
    .setDescription('Sadece bot mesajlarini temizler')
    .addIntegerOption(opt => opt.setName('adet').setDescription('Kac mesaj silinecek (varsayilan: 50)').setMinValue(1).setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Mesajlari Yonet** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const adet = interaction.options.getInteger('adet') || 50;
    await interaction.deferReply({ ephemeral: true });

    try {
      const fetched = await interaction.channel.messages.fetch({ limit: 100 });
      const botMesajlari = fetched.filter(m => m.author.bot).first(adet);

      if (botMesajlari.length === 0) {
        return interaction.editReply({ content: 'Son 100 mesajda bot mesaji bulunamadi.' });
      }

      const silinen = await interaction.channel.bulkDelete(botMesajlari, true);
      await interaction.editReply({ content: `:white_check_mark: **${silinen.size}** bot mesaji silindi!` });
    } catch (e) {
      await interaction.editReply({ content: ':x: Mesajlar silinirken hata olustu. 14 gun eskimesiz mesajlar silinemez.' });
    }
  },
};
