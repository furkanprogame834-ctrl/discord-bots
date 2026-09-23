const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Ticket paneli olusturur')
    .addChannelOption(option => option.setName('kanal').setDescription('Panelin gonderilecek kanali').addChannelTypes(0).setRequired(true))
    .addRoleOption(option => option.setName('destek-rolu').setDescription('Ticket acilinca gorevlenecek rol').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Sunucuyu Yonet** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const kanal = interaction.options.getChannel('kanal');
    const destekRol = interaction.options.getRole('destek-rolu');

    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(__dirname, '..', 'guild-config.json');

    let config = {};
    try {
      if (fs.existsSync(configPath)) config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {}

    if (!config[interaction.guild.id]) config[interaction.guild.id] = {};
    config[interaction.guild.id].ticketRole = destekRol.id;

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    const embed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setTitle(':ticket: DESTEK SISTEMI')
      .setDescription(
        'Destek almak icin asagidaki butona tiklayin!\n\n' +
        ':clock1: Bir yetkili size en kisa surede donecektir.\n' +
        ':white_check_mark: Ticket acmadan once arastirma yapmayi unutmayin.'
      )
      .setFooter({ text: 'Ticket Sistemi' })
      .setTimestamp();

    const buton = new ButtonBuilder()
      .setCustomId('ticket-ac')
      .setLabel('Ticket Ac')
      .setEmoji('🎫')
      .setStyle(ButtonStyle.Primary);

    const satir = new ActionRowBuilder().addComponents(buton);

    await kanal.send({ embeds: [embed], components: [satir] });

    await interaction.reply({ content: `:white_check_mark: Ticket paneli ${kanal} kanalina gonderildi!`, ephemeral: true });
  },
};
