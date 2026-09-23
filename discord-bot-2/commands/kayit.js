const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { listele, loadDb } = require('../lib/kayit-db.js');

function zamanFarki(ms) {
  const dk = Math.floor(ms / 60000);
  const saat = Math.floor(dk / 60);
  const gun = Math.floor(saat / 24);
  if (gun > 0) return `${gun} gün önce`;
  if (saat > 0) return `${saat} saat önce`;
  return `${dk} dk önce`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kayit')
    .setDescription('Sunucuya gelen üyelerin kaydını göster'),
  async execute(interaction) {
    const db = loadDb();
    const kayitlar = (db[interaction.guild.id] || []).slice().reverse();

    if (!kayitlar.length) {
      return interaction.reply({ content: '📭 Henüz kayıt olan üye yok.', flags: 64 });
    }

    const toplam = kayitlar.length;
    const ilk10 = kayitlar.slice(0, 10);

    const liste = ilk10.map((k, i) => {
      const uye = interaction.guild.members.cache.get(k.id);
      return `${i + 1}. **${k.isim}** ${uye ? '' : '(ayrıldı)'} — ${zamanFarki(Date.now() - k.zaman)}`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle(`📝 Kayıt Defteri (${toplam})`)
      .setDescription(liste + (toplam > 10 ? `\n\n... ve ${toplam - 10} daha` : ''))
      .setFooter({ text: 'Son 100 kayıt tutulur' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};