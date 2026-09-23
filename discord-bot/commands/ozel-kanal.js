const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

const izinTemiz = {
  ViewChannel: null,
  ReadMessageHistory: null,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ozel-kanal')
    .setDescription('Bir rol sadece secilen kanali gorsun, diger kanal/kategorileri goremesin')
    .addSubcommand(sub =>
      sub.setName('ayarla')
        .setDescription('Rolu tum kanallardan gizle, sadece secilen kanali goster')
        .addRoleOption(opt => opt.setName('rol').setDescription('Gizlenecek rol').setRequired(true))
        .addChannelOption(opt => opt.setName('kanal').setDescription('Rolun sadece gorecegi kanal').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('sifirla')
        .setDescription('Rolun butun kanal izinlerini sifirla (herkes gibi olsun)')
        .addRoleOption(opt => opt.setName('rol').setDescription('Gizliligi kaldirilacak rol').setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** olanlar kullanabilir!', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const rol = interaction.options.getRole('rol');
    await interaction.deferReply({ ephemeral: true });

    try {
      const kanallar = interaction.guild.channels.cache.filter(c =>
        c.type === ChannelType.GuildText || c.type === ChannelType.GuildCategory ||
        c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildAnnouncement ||
        c.type === ChannelType.GuildForum
      );

      if (sub === 'ayarla') {
        const hedefKanal = interaction.options.getChannel('kanal');

        let gizlenen = 0;
        let gizlemeHatasi = 0;
        await Promise.all(kanallar.map(async (kanal) => {
          try {
            await kanal.permissionOverwrites.edit(rol.id, {
              ViewChannel: kanal.id === hedefKanal.id,
              ReadMessageHistory: kanal.id === hedefKanal.id,
            });
            if (kanal.id !== hedefKanal.id) gizlenen++;
          } catch (e) {
            gizlemeHatasi++;
          }
        }));

        if (gizlemeHatasi === kanallar.size) throw new Error('Butun kanal izin ayarlari basarisiz.');

        const embed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('✅ Özel Kanal Kuruldu')
          .setDescription(
            `<@&${rol.id}> rolü artık **sadece** <#${hedefKanal.id}> kanalını görebilir.\n\n` +
            `👁️ Gizlenen kanal/kategori: **${gizlenen}**\n` +
            `📂 Kullanıcılar sunucuda kapalı 📁 (salonları göremez) kanalları göremez.`
          )
          .setTimestamp();
        return interaction.editReply({ embeds: [embed] });
      }

      if (sub === 'sifirla') {
        let temizlenen = 0;
        let hata = 0;
        await Promise.all(kanallar.map(async (kanal) => {
          try {
            await kanal.permissionOverwrites.edit(rol.id, izinTemiz);
            temizlenen++;
          } catch (e) {
            hata++;
          }
        }));

        if (hata === kanallar.size) throw new Error('Butun izin temizleme basarisiz.');

        const embed = new EmbedBuilder()
          .setColor(0xFFA500)
          .setTitle('♻️ İzinler Sıfırlandı')
          .setDescription(`<@&${rol.id}> rolünün **${temizlenen}** kanal/kategorideki özel izinleri kaldırıldı. Rol artık sunucunun normal izin kurallarına tabi.`)
          .setTimestamp();
        return interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Ozel kanal hatasi:', error.message, error.code);
      return interaction.editReply({
        content: '❌ İşlem başarısız!\n\n**Olası nedenler:**\n- Bot yetkisi yetersiz (ManageChannels)\n- Rol, botun üstünde bir sırada\n- API hatası',
      });
    }
  },
};