const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { loadJson, saveJson, kumarDbPath } = require('./kumar-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('para-ver')
    .setDescription('Kullaniciya para ver')
    .addUserOption(opt => opt.setName('kullanici').setDescription('Para verilecek kisi').setRequired(true))
    .addIntegerOption(opt => opt.setName('miktar').setDescription('Miktar').setRequired(true).setMinValue(1))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** kullanabilir!', ephemeral: true });
    }

    const hedef = interaction.options.getUser('kullanici');
    const miktar = interaction.options.getInteger('miktar');
    const { bakiyEkle, bakiyeAl } = require('./kumar-yardimci.js');

    bakiyEkle(hedef.id, miktar);

    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle(':money_with_wings: Para Verildi!')
        .setDescription(`${hedef} kullanicisine **${miktar} TL** verildi!\nYeni bakiye: **${bakiyeAl(hedef.id)} TL**`)
        .setColor(0x00FF00)
        .setTimestamp()],
    });
  },
};
