const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const tekrar = require('./tekrar-et.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tekrar-durdur')
    .setDescription('Belirtilen kanaldaki tekrari durdurur')
    .addChannelOption(opt => opt.setName('kanal').setDescription('Tekrari durdurulacak kanal (default: burasi)').addChannelTypes(0))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Mesajlari Yonet** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const kanal = interaction.options.getChannel('kanal') || interaction.channel;
    const aktifKanal = tekrar.aktif.has(kanal.id);

    if (!aktifKanal) {
      return interaction.reply({ content: `:x: **${kanal}** kanalinda aktif bir tekrar yok.`, ephemeral: true });
    }

    tekrar.durdur(kanal.id);
    await interaction.reply({ content: `:stop_button: **${kanal}** kanalindaki tekrar durduruldu.` });
  },
};
