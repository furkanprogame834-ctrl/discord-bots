const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kayit-olustur')
    .setDescription('Kayit olma butonu olan mesaj olusturur')
    .addStringOption(opt => opt.setName('baslik').setDescription('Kayit mesaji basligi').setRequired(true))
    .addStringOption(opt => opt.setName('aciklama').setDescription('Kayit mesaji aciklamasi').setRequired(true))
    .addRoleOption(opt => opt.setName('rol').setDescription('Butona basanlara verilecek rol').setRequired(true))
    .addStringOption(opt => opt.setName('buton').setDescription('Buton uzerindeki yazi (default: Kayit Ol)'))
    .addChannelOption(opt => opt.setName('kanal').setDescription('Gonderilecek kanal (bos = bu kanal)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Yonetici** yetkisi gerekir.', ephemeral: true });
    }

    const baslik = interaction.options.getString('baslik');
    const aciklama = interaction.options.getString('aciklama');
    const rol = interaction.options.getRole('rol');
    const butonLabel = interaction.options.getString('buton') || 'Kayit Ol';
    const kanal = interaction.options.getChannel('kanal') || interaction.channel;

    const embed = new EmbedBuilder()
      .setTitle(`:bookmark_tabs: ${baslik}`)
      .setDescription(aciklama)
      .setColor(0x5865F2)
      .addFields({ name: ':label: Verilecek rol', value: `<@&${rol.id}>`, inline: true })
      .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`kayit_${rol.id}`)
        .setLabel(butonLabel.slice(0, 80))
        .setStyle(ButtonStyle.Success)
        .setEmoji(':white_check_mark:')
    );

    await kanal.send({ embeds: [embed], components: [row] });

    await interaction.reply({ content: `:white_check_mark: Kayit mesaji **${kanal.name}** kanalina gonderildi. Butona basanlar **${rol.name}** rolünü alacak.`, ephemeral: true });
  },
};
