const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { bakiyeAl, paraCikar, bakiyEkle, kumarYasakli, kumarSayacVeRol } = require('./kumar-yardimci.js');

function kartla() {
  const desteler = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const d = desteler[Math.floor(Math.random() * desteler.length)];
  let deger = parseInt(d);
  if (isNaN(deger)) {
    deger = d === 'A' ? 11 : 10;
  }
  return { gosterim: d, deger };
}

function elTopla(el) {
  let sum = 0;
  let as = 0;
  for (const k of el) {
    sum += k.deger;
    if (k.gosterim === 'A') as++;
  }
  while (sum > 21 && as > 0) {
    sum -= 10;
    as--;
  }
  return sum;
}

const aktifOyunlar = {};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('21 oyunu - kasaya karsi')
    .addIntegerOption(opt => opt.setName('bahis').setDescription('Bahis miktari').setRequired(true).setMinValue(1))
    .setDefaultMemberPermissions(0),
  async execute(interaction) {
    if (kumarYasakli(interaction.guild.id, interaction.user.id)) {
      return interaction.reply({ content: ':no_entry: Kumarhaneden yasaklandin!', ephemeral: true });
    }

    const bahis = interaction.options.getInteger('bahis');
    if (bakiyeAl(interaction.user.id) < bahis) {
      return interaction.reply({ content: `:x: Yeterli paran yok! Bakiyen: **${bakiyeAl(interaction.user.id)} TL**`, ephemeral: true });
    }

    paraCikar(interaction.user.id, bahis);
    kumarSayacVeRol(interaction);

    const oyuncu = [kartla(), kartla()];
    const kasa = [kartla(), kartla()];

    aktifOyunlar[interaction.user.id] = { bahis, oyuncu, kasa, durum: 'devam' };

    function render() {
      const op = elTopla(oyuncu);
      const kp = elTopla(kasa);

      const embed = new EmbedBuilder()
        .setTitle(':spades: Blackjack - 21')
        .addFields(
          { name: ':bust_in_silhouette: Sen', value: `Kartlar: ${oyuncu.map(k => k.gosterim).join(' ')}\nToplam: **${op}**`, inline: true },
          { name: ':trophy: Kasa', value: `Kartlar: ${kasa[0].gosterim} ??\nToplam: ?`, inline: true },
          { name: ':banknote: Bahis', value: `${bahis} TL`, inline: true },
        )
        .setColor(0x00BFFF)
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('bj_ekle').setLabel('Kart Cek').setStyle(ButtonStyle.Success).setEmoji('🃏'),
        new ButtonBuilder().setCustomId('bj_dur').setLabel('Dur').setStyle(ButtonStyle.Danger).setEmoji('✋'),
      );
      return { embed, row };
    }

    const { embed, row } = render();
    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const collector = msg.createMessageComponentCollector({ time: 30000 });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'Sadece oyunu baslatan kisi oynayabilir!', ephemeral: true });
      }

      const oyun = aktifOyunlar[interaction.user.id];
      if (!oyun || oyun.durum !== 'devam') return;

      if (i.customId === 'bj_ekle') {
        oyun.oyuncu.push(kartla());
        const op = elTopla(oyun.oyuncu);

        if (op > 21) {
          oyun.durum = 'bitti';
          const embed = new EmbedBuilder()
            .setTitle(':spades: Blackjack - 21')
            .setDescription(`:x: **Patladin!** Toplam: ${op}\nKaybettin: **${bahis} TL**`)
            .addFields(
              { name: 'Sen', value: `Kartlar: ${oyun.oyuncu.map(k => k.gosterim).join(' ')}\nToplam: **${op}**`, inline: true },
              { name: 'Kasa', value: `Kartlar: ${oyun.kasa.map(k => k.gosterim).join(' ')}\nToplam: **${elTopla(oyun.kasa)}**`, inline: true },
            )
            .setColor(0xFF0000)
            .setFooter({ text: `Yeni bakiye: ${bakiyeAl(interaction.user.id)} TL` })
            .setTimestamp();
          await i.update({ embeds: [embed], components: [] });
          delete aktifOyunlar[interaction.user.id];
          return;
        }

        const { embed, row } = render();
        await i.update({ embeds: [embed], components: [row] });
        return;
      }

      if (i.customId === 'bj_dur') {
        oyun.durum = 'bitti';
        let kasaToplam = elTopla(oyun.kasa);
        while (kasaToplam < 17) {
          oyun.kasa.push(kartla());
          kasaToplam = elTopla(oyun.kasa);
        }

        const op = elTopla(oyun.oyuncu);
        let sonuc = '';
        let kazandi = false;
        let kazanc = 0;

        if (kasaToplam > 21) { sonuc = `:tada: **Kasa patladi!**`; kazandi = true; kazanc = bahis * 2; }
        else if (kasaToplam > op) { sonuc = `:x: **Kasa kazandi!**`; }
        else if (op > kasaToplam) { sonuc = `:tada: **Sen kazandin!**`; kazandi = true; kazanc = bahis * 2; }
        else { sonuc = `:handshake: **Berabere!**`; kazanc = bahis; }

        if (kazanc > 0) bakiyEkle(interaction.user.id, kazanc);

        const embed = new EmbedBuilder()
          .setTitle(':spades: Blackjack - 21')
          .setDescription(sonuc)
          .addFields(
            { name: 'Sen', value: `Kartlar: ${oyun.oyuncu.map(k => k.gosterim).join(' ')}\nToplam: **${op}**`, inline: true },
            { name: 'Kasa', value: `Kartlar: ${oyun.kasa.map(k => k.gosterim).join(' ')}\nToplam: **${kasaToplam}**`, inline: true },
            { name: ':banknote: Sonuc', value: kazandi ? `**+${kazanc} TL**` : kazanc === bahis ? `Paran geri: ${bahis} TL` : `**-${bahis} TL**`, inline: true },
          )
          .setColor(kazandi ? 0x00FF00 : 0xFF0000)
          .setFooter({ text: `Yeni bakiye: ${bakiyeAl(interaction.user.id)} TL` })
          .setTimestamp();

        await i.update({ embeds: [embed], components: [] });
        delete aktifOyunlar[interaction.user.id];
      }
    });

    collector.on('end', async () => {
      if (aktifOyunlar[interaction.user.id]?.durum === 'devam') {
        bakiyEkle(interaction.user.id, bahis);
        delete aktifOyunlar[interaction.user.id];
        await interaction.editReply({ content: ':warning: Sure doldu, bahisin iade edildi.', components: [] });
      }
    });
  },
};
