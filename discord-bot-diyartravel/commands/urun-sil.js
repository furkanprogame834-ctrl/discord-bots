const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const { loadDb, saveDb, urunlerDbPath, urunleriGetir } = require('./siparis.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('urun-sil')
    .setDescription('Siparis sisteminden urun siler (admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Bu komutu sadece **Yonetici** olanlar kullanabilir!', flags: 64 });
    }

    const urunler = urunleriGetir(interaction.guild.id);
    if (urunler.length === 0) {
      return interaction.reply({ content: '⚠️ Silinecek ürün yok.', flags: 64 });
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId('urun-sil-sec')
      .setPlaceholder('🗑️ Silinecek ürünü seç...')
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(urunler.map(u => ({
        label: `${u.emoji ? u.emoji + ' ' : ''}${u.ad} — ${u.fiyat}₡`,
        value: u.value,
      })));

    const embed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setTitle('🗑️ Ürün Sil')
      .setDescription('Silmek istediğin ürünü seç.')
      .setTimestamp();

    await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)], flags: 64 });
  },
};

module.exports.handleSec = async (interaction) => {
  const urunler = urunleriGetir(interaction.guild.id);
  const secilen = urunler.find(u => u.value === interaction.values[0]);
  if (!secilen) return interaction.reply({ content: '⚠️ Ürün bulunamadı.', flags: 64 });

  const db = loadDb(urunlerDbPath);
  db[interaction.guild.id] = (db[interaction.guild.id] || []).filter(u => u.ad !== secilen.ad);
  saveDb(urunlerDbPath, db);

  const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('🗑️ Ürün Silindi')
    .setDescription(`${secilen.emoji ? secilen.emoji + ' ' : ''}**${secilen.ad}** silindi.`)
    .setTimestamp();
  await interaction.update({ embeds: [embed], components: [] });
};