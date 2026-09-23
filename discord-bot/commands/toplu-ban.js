const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { toplaIsimler } = require('./toplu-yardimci.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('toplu-ban')
    .setDescription('Birden fazla uyeyi toplu yasaklar (ID, @mention veya kullanici adi)')
    .addStringOption(opt => opt.setName('kisiler').setDescription('Yasaklanacaklar: ID veya kullanici adlari (boslukla ayir)').setRequired(true))
    .addStringOption(opt => opt.setName('sebep').setDescription('Yasaklama sebebi'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Uyeleri Yasakla** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const kisilerStr = interaction.options.getString('kisiler');
    const sebep = interaction.options.getString('sebep') || 'Toplu ban (sebep belirtilmedi)';
    const guild = interaction.guild;
    const hedefler = toplaIsimler(kisilerStr, guild);

    if (hedefler.length === 0) {
      return interaction.reply({ content: ':x: Hicbir kullanici bulunamadi! ID, @mention veya kullanici adi gir (boslukla ayir).', ephemeral: true });
    }

    let basarili = 0;
    let basarisiz = 0;
    const sonuclar = [];

    for (const member of hedefler) {
      try {
        if (!member.bannable) {
          sonuclar.push(`:no_entry: **${member.user.username}** yasaklanamadi (bot yetkisi)`);
          basarisiz++;
          continue;
        }
        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
          sonuclar.push(`:no_entry: **${member.user.username}** esit/yuksek rol`);
          basarisiz++;
          continue;
        }
        await member.ban({ reason: sebep });
        sonuclar.push(`:white_check_mark: **${member.user.username}** yasaklandi`);
        basarili++;
      } catch (e) {
        sonuclar.push(`:x: **${member.user.username}** hata`);
        basarisiz++;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(':hammer: Toplu Yasaklama')
      .setDescription(`**${hedefler.length}** kisi islendi\n:white_check_mark: **${basarili}** yasaklandi\n:x: **${basarisiz}** basarisiz`)
      .addFields({ name: ':page_facing_up: Detay', value: sonuclar.join('\n'), inline: false })
      .setColor(basarisiz === 0 ? 0x00FF00 : 0xFFA500)
      .setFooter({ text: `Sebep: ${sebep}` })
      .setTimestamp();

    try { await interaction.channel.send({ embeds: [embed] }); }
    catch (e) { await interaction.reply({ embeds: [embed] }); }
  },
};
