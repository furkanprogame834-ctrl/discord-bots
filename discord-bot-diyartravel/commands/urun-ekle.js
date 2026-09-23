const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { loadDb, saveDb, urunlerDbPath, urunleriGetir } = require('./siparis.js');

const MAX_URUN = 25;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('urun-ekle')
    .setDescription('Siparis sistemine urun ekler (admin)')
    .addStringOption(opt => opt.setName('ad').setDescription('Urun adi').setRequired(true))
    .addIntegerOption(opt => opt.setName('fiyat').setDescription('Fiyat (OwO ?)').setRequired(true).setMinValue(1))
    .addStringOption(opt => opt.setName('emoji').setDescription('Urun emojisi (opsiyonel)'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** olanlar kullanabilir!', flags: 64 });
    }

    const ad = interaction.options.getString('ad');
    const fiyat = interaction.options.getInteger('fiyat');
    const emoji = interaction.options.getString('emoji');

    const mevcut = urunleriGetir(interaction.guild.id);
    if (mevcut.length >= MAX_URUN) {
      return interaction.reply({ content: `⚠️ Maksimum **${MAX_URUN}** ürün eklenebilir.`, flags: 64 });
    }

    const db = loadDb(urunlerDbPath);
    if (!db[interaction.guild.id]) db[interaction.guild.id] = [];
    db[interaction.guild.id].push({ ad, fiyat, emoji: emoji || null, zaman: Date.now() });
    saveDb(urunlerDbPath, db);

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('✅ Ürün Eklendi')
      .setDescription(`${emoji ? emoji + ' ' : ''}**${ad}** — **${fiyat}₡**\n\nMüşteriler artık \`/siparis\` ile bu ürünü sipariş edebilir.`)
      .setTimestamp();
    return interaction.reply({ embeds: [embed], flags: 64 });
  },
};