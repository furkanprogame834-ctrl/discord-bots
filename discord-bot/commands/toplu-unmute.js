const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { toplaIsimler } = require('./toplu-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('toplu-unmute')
    .setDescription('Birden fazla uyeyin susturmasini toplu kaldirir')
    .addStringOption(opt => opt.setName('kisiler').setDescription('Susturmasi kaldirilacaklar: ID veya kullanici adlari').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Uyeleri Yonet** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const hedefler = toplaIsimler(interaction.options.getString('kisiler'), interaction.guild);
    if (hedefler.length === 0) {
      return interaction.reply({ content: ':x: Hicbir kullanici bulunamadi!', ephemeral: true });
    }

    let basarili = 0;
    let basarisiz = 0;
    const sonuclar = [];

    for (const member of hedefler) {
      try {
        if (!member.isCommunicationDisabled()) {
          sonuclar.push(`:grey_question: **${member.user.username}** zaten susturulmuyor`);
          continue;
        }
        await member.timeout(null);
        sonuclar.push(`:white_check_mark: **${member.user.username}** susturmasi kaldirildi`);
        basarili++;
      } catch (e) {
        sonuclar.push(`:no_entry: **${member.user.username}** kaldirilamadi`);
        basarisiz++;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(':speaker: Toplu Unmute')
      .setDescription(`**${hedefler.length}** kisi islendi\n:white_check_mark: **${basarili}** susturmasi kaldirildi\n:x: **${basarisiz}** basarisiz`)
      .addFields({ name: ':page_facing_up: Detay', value: sonuclar.join('\n'), inline: false })
      .setColor(0x00FF00)
      .setTimestamp();

    try { await interaction.channel.send({ embeds: [embed] }); }
    catch (e) { await interaction.reply({ embeds: [embed] }); }
  },
};
