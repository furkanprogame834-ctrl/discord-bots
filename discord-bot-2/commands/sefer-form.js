const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const TURE = {
  izin: { ad: 'Sefer İzin', sembol: '✅', kanal: 'sefer-başlangıç', renk: 0xFFA500 },
  bitis: { ad: 'Sefer Bitiş', sembol: '🏁', kanal: 'sefer-bitiş', renk: 0x57F287 },
  duyuru: { ad: 'Sefer Duyuru', sembol: '📢', kanal: 'sefer-duyuru', renk: 0x00BFFF },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sefer-form')
    .setDescription('Sefer izin/bitiş/duyuru formu doldurur ve kanala gönderir')
    .addStringOption(o => o.setName('tür').setDescription('Form türü').setRequired(true).addChoices(
      { name: 'Sefer İzin', value: 'izin' },
      { name: 'Sefer Bitiş', value: 'bitis' },
      { name: 'Sefer Duyuru', value: 'duyuru' },
    ))
    .addStringOption(o => o.setName('firma').setDescription('Hangi Firma').setRequired(true))
    .addStringOption(o => o.setName('roblox-nick').setDescription('Roblox Nick').setRequired(true))
    .addStringOption(o => o.setName('plaka').setDescription('Kullandığın Aracın Plakası').setRequired(true))
    .addStringOption(o => o.setName('kalkış').setDescription('Kalktığın Yer').setRequired(true))
    .addStringOption(o => o.setName('bitiş-yer').setDescription('Bitirdiğin Yer').setRequired(true))
    .addStringOption(o => o.setName('kaçıncı-sefer').setDescription('Kaçıncı Seferin').setRequired(true))
    .addStringOption(o => o.setName('saat').setDescription('Vardığın Saat').setRequired(true))
    .addStringOption(o => o.setName('muavin').setDescription('Muavin').setRequired(false))
    .addStringOption(o => o.setName('not').setDescription('Ek Not').setRequired(false)),
  async execute(interaction) {
    const tur = interaction.options.getString('tür');
    const tanim = TURE[tur];
    if (!tanim) return interaction.reply({ content: 'Geçersiz tür!', flags: 64 });

    const v = {
      firma: interaction.options.getString('firma'),
      nick: interaction.options.getString('roblox-nick'),
      plaka: interaction.options.getString('plaka'),
      kalkis: interaction.options.getString('kalkış'),
      varis: interaction.options.getString('bitiş-yer'),
      kacinci: interaction.options.getString('kaçıncı-sefer'),
      saat: interaction.options.getString('saat'),
      muavin: interaction.options.getString('muavin') || '-',
      not: interaction.options.getString('not'),
    };

    let config = {};
    const configPath = path.join(__dirname, '..', 'guild-config.json');
    try { if (fs.existsSync(configPath)) config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch (e) {}
    const taglar = (config[interaction.guild.id] || {}).seferTaglar || '';

    const embed = this.buildEmbed(tanim, v, taglar, interaction.user);

    const onay = new ButtonBuilder().setCustomId(`sefer-gonder_${tur}`).setLabel(`${tanim.sembol} Gönder`).setStyle(ButtonStyle.Success);
    const iptalBtn = new ButtonBuilder().setCustomId('sefer-iptal').setLabel('❌ İptal').setStyle(ButtonStyle.Danger);

    global.seferFormVeri = global.seferFormVeri || {};
    global.seferFormVeri[interaction.user.id] = { tur, v };

    await interaction.reply({
      embeds: [embed, new EmbedBuilder().setColor(0x5865F2).setDescription(`**Taglar:** ${taglar || 'yok'}\nGöndermek için ✅ Gönder'e bas.`)],
      components: [new ActionRowBuilder().addComponents(onay, iptalBtn)],
      flags: 64,
    });
  },
  buildEmbed(tanim, v, taglar, user) {
    const embed = new EmbedBuilder()
      .setColor(tanim.renk)
      .setTitle(`${tanim.sembol} ${tanim.ad} | ${v.firma}`)
      .addFields(
        { name: '🔹 Hangi Firma', value: v.firma || '-', inline: true },
        { name: '🔹 Roblox Nick', value: v.nick || '-', inline: true },
        { name: '🔹 Kullandığın Aracın Plakası', value: v.plaka || '-', inline: true },
        { name: '🔹 Kalktığın Yer', value: v.kalkis || '-', inline: true },
        { name: '🔹 Bitirdiğin Yer', value: v.varis || '-', inline: true },
        { name: '🔹 Kaçıncı Seferin', value: v.kacinci || '-', inline: true },
        { name: '🔹 Vardığın Saat', value: v.saat || '-', inline: true },
        { name: '🔹 Muavin', value: v.muavin || '-', inline: true },
      )
      .setFooter({ text: `${user ? user.tag : ''} tarafından dolduruldu` })
      .setTimestamp();
    if (v.not) embed.addFields({ name: '📝 Ek Not', value: v.not });
    return embed;
  },
};

module.exports.TURE = TURE;

module.exports.handleModal = async (interaction) => false;