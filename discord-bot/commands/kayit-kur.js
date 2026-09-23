const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const kayitDbPath = path.join(__dirname, '..', 'kayit-sistemi-db.json');
const guildConfigPath = path.join(__dirname, '..', 'guild-config.json');

function loadJson(p) {
  try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) {}
  return {};
}

function saveJson(p, d) {
  fs.writeFileSync(p, JSON.stringify(d, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kayit-kur')
    .setDescription('Gelen/giden logu ve butonlu kayit paneli kurar')
    .addRoleOption(opt => opt.setName('yetkili-rol').setDescription('Kayit yetkilisi rolü').setRequired(true))
    .addRoleOption(opt => opt.setName('uye-rol').setDescription('Kayit edilenlerin alacagi rol').setRequired(true))
    .addChannelOption(opt => opt.setName('panel-kanal').setDescription('Kayit panelinin kurulacagi kanal (bos: #kayit-panel olusturur)').addChannelTypes(ChannelType.GuildText))
    .addChannelOption(opt => opt.setName('log-kanal').setDescription('Gelen/giden mesajlarinin duscegi kanal (bos: #giris-cikis olusturur)').addChannelTypes(ChannelType.GuildText))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** olanlar kullanabilir!', ephemeral: true });
    }

    const yetkiliRol = interaction.options.getRole('yetkili-rol');
    const uyeRol = interaction.options.getRole('uye-rol');

    await interaction.deferReply({ ephemeral: true });

    try {
      let panelKanal = interaction.options.getChannel('panel-kanal');
      if (!panelKanal) {
        panelKanal = interaction.guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.name === 'kayit-panel');
      }
      if (!panelKanal) {
        panelKanal = await interaction.guild.channels.create({ name: 'kayit-panel', type: ChannelType.GuildText });
      }

      let logKanal = interaction.options.getChannel('log-kanal');
      if (!logKanal) {
        logKanal = interaction.guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.name === 'giris-cikis');
      }
      if (!logKanal) {
        logKanal = await interaction.guild.channels.create({ name: 'giris-cikis', type: ChannelType.GuildText });
      }

      const kayitDb = loadJson(kayitDbPath);
      kayitDb[interaction.guild.id] = {
        kanal: panelKanal.id,
        mesaj: 'Sunucumuza hos geldin! Kayit yetkilisi seni kayit edecektir.',
        yetkiliRol: yetkiliRol.id,
        uyeRol: uyeRol.id,
      };
      saveJson(kayitDbPath, kayitDb);

      const config = loadJson(guildConfigPath);
      if (!config[interaction.guild.id]) config[interaction.guild.id] = {};
      config[interaction.guild.id].logKanal = logKanal.id;
      saveJson(guildConfigPath, config);

      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('📋 Kayıt Yetkilisi Paneli')
        .setDescription(
          `Aşağıdan **kayıt edilecek üyeyi** seç, ardından **Kayıt Et** butonuna bas.\n\n` +
          `✅ Kayıt edilince üye şu rolü alır: <@&${uyeRol.id}>\n` +
          `👥 Bu paneli kullanabilen: <@&${yetkiliRol.id}> + Yöneticiler`
        )
        .setTimestamp();

      const kayitsiz = interaction.guild.members.cache.filter(m => !m.user.bot && !m.roles.cache.has(uyeRol.id));
      if (kayitsiz.size > 0) {
        const menu = new StringSelectMenuBuilder()
          .setCustomId('kayit-uye-sec')
          .setPlaceholder('🎯 Kayıt edilecek üyeyi seç...')
          .addOptions(
            kayitsiz.first(25).map(m => ({
              label: (m.user.username || 'Kullanıcı').slice(0, 90),
              value: m.id,
              description: (m.displayName || '').slice(0, 90) || undefined,
            }))
          );
        const onayRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('kayit-onayla').setLabel('✅ Kayıt Et').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('kayit-iptal').setLabel('❌ Vazgeç').setStyle(ButtonStyle.Danger)
        );
        await panelKanal.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu), onayRow] });
      } else {
        await panelKanal.send({ embeds: [embed] });
      }

      const onay = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Kayıt Sistemi Kuruldu!')
        .setDescription(
          `**Kayıt paneli:** <#${panelKanal.id}>\n` +
          `**Gelen/giden logu:** <#${logKanal.id}>\n` +
          `**Kayıt yetkilisi rolü:** <@&${yetkiliRol.id}>\n` +
          `**Üye rolü:** <@&${uyeRol.id}>`
        )
        .setTimestamp();
      return interaction.editReply({ embeds: [onay] });
    } catch (error) {
      console.error('Kayit sistemi kurma hatasi:', error.message, error.code);
      return interaction.editReply({
        content: '❌ Kayit sistemi kurulamadi!\n\n**Olasin nedenler:**\n- Bot yetkisi yetmiyor (ManageChannels/ManageRoles)\n- API hatasi',
      });
    }
  },
};