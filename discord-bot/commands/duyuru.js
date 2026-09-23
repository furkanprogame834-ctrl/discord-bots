const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('duyuru')
    .setDescription('Embedli + mentionlu duyuru yayinlar')
    .addStringOption(opt => opt.setName('baslik').setDescription('Duyuru basligi').setRequired(true))
    .addStringOption(opt => opt.setName('mesaj').setDescription('Duyuru mesaji').setRequired(true))
    .addChannelOption(opt => opt.setName('kanal').setDescription('Yayinlanacak kanal (default: burasi)').addChannelTypes(0))
    .addStringOption(opt => opt.setName('rol').setDescription('Mention edilecek rol (ornek: @everyone)'))
    .addIntegerOption(opt => opt.setName('renk').setDescription('Embed rengi (HEX, ornek: 00FF00)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Mesajlari Yonet** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const baslik = interaction.options.getString('baslik');
    const mesaj = interaction.options.getString('mesaj');
    const kanal = interaction.options.getChannel('kanal') || interaction.channel;
    const rolMention = interaction.options.getString('rol');
    const renkStr = interaction.options.getInteger('renk');

    let rolId = null;
    if (rolMention) {
      if (rolMention === '@everyone') {
        rolId = '@everyone';
      } else {
        const match = rolMention.match(/^<@&(\d+)>$/);
        const byId = /^\d+$/.test(rolMention) ? interaction.guild.roles.cache.get(rolMention) : null;
        const rol = match ? interaction.guild.roles.cache.get(match[1]) : byId || interaction.guild.roles.cache.find(r => r.name.toLowerCase() === rolMention.toLowerCase());
        if (rol) rolId = rol.id;
      }
    }

    const renk = renkStr ? renkStr : 0x00BFFF;

    const embed = new EmbedBuilder()
      .setTitle(`:megaphone: ${baslik}`)
      .setDescription(mesaj)
      .setColor(renk)
      .setFooter({ text: interaction.guild.name })
      .setTimestamp();

    const content = rolId === '@everyone' ? '@everyone' : rolId ? `<@&${rolId}>` : '';

    try {
      await kanal.send({ content, embeds: [embed] });
      if (interaction.channel.id !== kanal.id) {
        await interaction.reply({ content: `:white_check_mark: Duyuru **${kanal}** kanalina yayinlandi!`, ephemeral: true });
      } else {
        await interaction.reply({ content: ':white_check_mark: Duyuru yayinlandi!', ephemeral: true });
      }
    } catch (e) {
      await interaction.reply({ content: ':x: Duyuru yayinlanirken hata olustu!', ephemeral: true });
    }
  },
};
