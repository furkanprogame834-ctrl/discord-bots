const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

// YARIMKALDIK33 botunun ticket sayım verisi (ortak kullanım)
const TICKET_STATS = 'C:\\Users\\user\\Documents\\Default Project\\discord-bot\\ticket-stats.json';

function ticketDb() {
  try { return JSON.parse(fs.readFileSync(TICKET_STATS, 'utf8')); } catch { return null; }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sayim-ticket')
    .setDescription('YARIMKALDIK33 ticket sistemi açma/kapama sayılarını gösterir'),
  async execute(interaction) {
    const db = ticketDb();

    if (!db || Object.keys(db).length === 0) {
      return interaction.reply({ content: ':grey_exclamation: Ticket kaydı bulunmuyor.', flags: 64 });
    }

    // Her kullanıcı: acilan + kapatilan toplamı
    const toplamAcilan = Object.values(db).reduce((t, k) => t + (k.acilan || 0), 0);
    const toplamKapatilan = Object.values(db).reduce((t, k) => t + (k.kapatilan || 0), 0);

    const siralama = Object.entries(db)
      .map(([id, kayit]) => ({
        id,
        acilan: kayit.acilan || 0,
        kapatilan: kayit.kapatilan || 0,
        toplam: (kayit.acilan || 0) + (kayit.kapatilan || 0),
      }))
      .filter(k => k.toplam > 0)
      .sort((a, b) => b.acilan - a.acilan)
      .slice(0, 10);

    if (siralama.length === 0) {
      return interaction.reply({ content: ':grey_exclamation: Bu sunucuda henüz ticket açılmamış.', flags: 64 });
    }

    const embed = new EmbedBuilder()
      .setTitle(':tickets: YARIMKALDIK33 Ticket Sayımı')
      .setDescription(
        `Toplam açılan: **${toplamAcilan}** | Toplam kapatılan: **${toplamKapatilan}**\n\n` +
        siralama.map((t, i) => {
          const kisi = interaction.client.users.cache.get(t.id);
          return `${i + 1}. **${kisi ? kisi.username : t.id}** — ${t.acilan} aç / ${t.kapatilan} kap (toplam ${t.toplam})`;
        }).join('\n')
      )
      .setColor(0x5865F2)
      .setFooter({ text: 'Top 10 - En çok ticket açanlar' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};