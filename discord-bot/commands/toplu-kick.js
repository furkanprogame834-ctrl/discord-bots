const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

function toplaIsimler(girdi, guild) {
  const kisiler = [];
  const atilan = new Set();

  if (!girdi) return kisiler;

  const kelimeler = girdi.split(/\s+/);

  for (const kelime of kelimeler) {
    if (/^\d{17,20}$/.test(kelime)) {
      const m = guild.members.cache.get(kelime);
      if (m && !atilan.has(m.id)) { kisiler.push(m); atilan.add(m.id); }
      continue;
    }

    const mention = kelime.match(/^<@!?(\d+)>$/);
    if (mention) {
      const m = guild.members.cache.get(mention[1]);
      if (m && !atilan.has(m.id)) { kisiler.push(m); atilan.add(m.id); }
      continue;
    }

    const duz = kelime.toLowerCase().replace(/[^a-z0-9\u00C0-\u017F_]/gi, '');
    let bulundu = false;
    for (const m of guild.members.cache.values()) {
      const isim = (m.displayName || m.user.username || '').toLowerCase().replace(/[^a-z0-9\u00C0-\u017F_]/gi, '');
      if (isim === duz && !atilan.has(m.id)) {
        kisiler.push(m); atilan.add(m.id); bulundu = true; break;
      }
    }
    if (!bulundu) {
      const aranan = duz;
      for (const m of guild.members.cache.values()) {
        if (!atilan.has(m.id) && m.user.id === aranan) {
          kisiler.push(m); atilan.add(m.id); break;
        }
      }
    }
  }

  return kisiler;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('toplu-kick')
    .setDescription('Birden fazla uyeyi toplu atar (ID, @mention veya kullanici adi)')
    .addStringOption(opt => opt.setName('kisiler').setDescription('Atilacaklar: ID veya kullanici adlari (boslukla ayir)').setRequired(true))
    .addRoleOption(opt => opt.setName('rol').setDescription('Bir rol belirtirsen o roldeki herkes atilir'))
    .addStringOption(opt => opt.setName('sebep').setDescription('Atma sebebi')),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Uyeleri At** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const sebep = interaction.options.getString('sebep') || 'Toplu kick (sebep belirtilmedi)';
    const guild = interaction.guild;
    const rol = interaction.options.getRole('rol');

    let hedefler = [];

    if (rol) {
      hedefler = [...guild.members.cache.values()].filter(m => m.roles.cache.has(rol.id));
      if (hedefler.length === 0) {
        return interaction.reply({ content: `:x: **${rol.name}** rolunde hic uye yok!`, ephemeral: true });
      }
    } else {
      const kisilerStr = interaction.options.getString('kisiler');
      hedefler = toplaIsimler(kisilerStr, guild);
      if (hedefler.length === 0) {
        return interaction.reply({ content: ':x: Hicbir kullanici bulunamadi! ID, @mention veya kullanici adi gir (boslukla ayir).', ephemeral: true });
      }
    }

    const toplam = hedefler.length;
    let basarili = 0;
    let basarisiz = 0;
    const sonuclar = [];

    for (const member of hedefler) {
      try {
        if (!member.kickable) {
          sonuclar.push(`:no_entry: **${member.user.username}** atilamadi (rol/bot yetkisi)`);
          basarisiz++;
          continue;
        }
        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
          sonuclar.push(`:no_entry: **${member.user.username}** atilamadi (esit/yuksek rol)`);
          basarisiz++;
          continue;
        }
        await member.kick(sebep);
        sonuclar.push(`:white_check_mark: **${member.user.username}** atildi`);
        basarili++;
      } catch (e) {
        sonuclar.push(`:x: **${member.user.username}** hata (${e.message || 'bilinmeyen'})`);
        basarisiz++;
      }
    }

    const baslik = rol ? `${rol.name} rolundeki herkes (${toplam} kisi)` : `${toplam} kisi`;

    const embed = new EmbedBuilder()
      .setTitle(':boom: Toplu Kick')
      .setDescription(`**${baslik}** islendi\n:white_check_mark: **${basarili}** atildi\n:x: **${basarisiz}** basarisiz`)
      .addFields({ name: ':page_facing_up: Detay', value: sonuclar.join('\n'), inline: false })
      .setColor(basarisiz === 0 ? 0x00FF00 : 0xFFA500)
      .setFooter({ text: `Sebep: ${sebep}` })
      .setTimestamp();

    try {
      await interaction.channel.send({ embeds: [embed] });
    } catch (e) {
      await interaction.reply({ embeds: [embed] });
    }
  },
};
