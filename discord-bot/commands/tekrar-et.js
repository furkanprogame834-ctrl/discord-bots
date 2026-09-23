const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

const aktif = new Map();

function kapat(id) {
  const ey = aktif.get(id);
  if (ey && ey.timer) { clearInterval(ey.timer); }
  aktif.delete(id);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tekrar-et')
    .setDescription('Belirtilen aralikla tekrar tekrar mesaj yayinlar (sureli)')
    .addStringOption(opt => opt.setName('mesaj').setDescription('Tekrarlanacak mesaj').setRequired(true))
    .addIntegerOption(opt => opt.setName('aralik').setDescription('Tekrar araligi (dakika)').setRequired(true).setMinValue(1).setMaxValue(10080))
    .addIntegerOption(opt => opt.setName('adet').setDescription('Kac kez tekrarlansin (default: surekli)').setMinValue(1).setMaxValue(100))
    .addChannelOption(opt => opt.setName('kanal').setDescription('Hedef kanal (default: burasi)').addChannelTypes(0))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Mesajlari Yonet** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const mesaj = interaction.options.getString('mesaj');
    const aralikDk = interaction.options.getInteger('aralik');
    const adet = interaction.options.getInteger('adet') || Infinity;
    const kanal = interaction.options.getChannel('kanal') || interaction.channel;

    kapat(kanal.id);

    let sayac = 0;

    const gonder = async (ilk) => {
      if (sayac >= adet) {
        kapat(kanal.id);
        return;
      }
      try {
        await kanal.send({ content: mesaj });
        sayac++;
      } catch (e) {
        kapat(kanal.id);
        if (ilk) await interaction.editReply({ content: ':x: Mesaj gonderilemedi! Kanal izinleri kontrol edin.', ephemeral: true });
        return;
      }
    };

    await gonder(true);
    await interaction.reply({ content: `:repeat: Tekrar basladi! Her **${aralikDk}** dakikada bir **${kanal}** kanalina ${adet === Infinity ? 'surekli' : adet + ' kez'} mesaj gonderilecek.\nDurdurmak icin: \`/tekrar-durdur\`` });

    const timer = setInterval(() => gonder(false), aralikDk * 60 * 1000);
    aktif.set(kanal.id, { timer, user: interaction.user.id });
  },
};

module.exports.durdur = kapat;
module.exports.aktif = aktif;
