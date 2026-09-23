const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('toplu-unban')
    .setDescription('Birden fazla yasaklamayi toplu kaldirir (ID\'leri boslukla ayir)')
    .addStringOption(opt => opt.setName('idler').setDescription('Yasagi kaldirilacak kullanici ID\'leri (boslukla ayir)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Uyeleri Yasakla** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const ids = [...new Set(interaction.options.getString('idler').split(/\s+/).filter(s => /^\d{17,20}$/.test(s)))];
    if (ids.length === 0) {
      return interaction.reply({ content: ':x: Gecerli kullanici ID\'si girilmedi!', ephemeral: true });
    }

    const guild = interaction.guild;
    let basarili = 0;
    let basarisiz = 0;
    const sonuclar = [];

    for (const id of ids) {
      try {
        await guild.members.unban(id);
        sonuclar.push(`:white_check_mark: <@${id}> yasagi kaldirildi`);
        basarili++;
      } catch (e) {
        sonuclar.push(`:x: <@${id}> kaldirilamadi (yasakli degil veya hata)`);
        basarisiz++;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(':unlock: Toplu Unban')
      .setDescription(`**${ids.length}** islem\n:white_check_mark: **${basarili}** kaldirildi\n:x: **${basarisiz}** basarisiz`)
      .addFields({ name: ':page_facing_up: Detay', value: sonuclar.join('\n'), inline: false })
      .setColor(0x00FF00)
      .setTimestamp();

    try { await interaction.channel.send({ embeds: [embed] }); }
    catch (e) { await interaction.reply({ embeds: [embed] }); }
  },
};
