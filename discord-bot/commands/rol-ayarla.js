const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rol-ayarla')
    .setDescription('Emojiye tiklayinca rol veren mesaj olusturur')
    .addChannelOption(opt => opt.setName('kanal').setDescription('Mesajin gonderilecek kanali').addChannelTypes(0).setRequired(true))
    .addStringOption(opt => opt.setName('baslik').setDescription('Mesaj basligi').setRequired(true))
    .addRoleOption(opt => opt.setName('rol1').setDescription('1. rol').setRequired(true))
    .addStringOption(opt => opt.setName('emoji1').setDescription('1. emoji').setRequired(true))
    .addRoleOption(opt => opt.setName('rol2').setDescription('2. rol'))
    .addStringOption(opt => opt.setName('emoji2').setDescription('2. emoji'))
    .addRoleOption(opt => opt.setName('rol3').setDescription('3. rol'))
    .addStringOption(opt => opt.setName('emoji3').setDescription('3. emoji'))
    .addRoleOption(opt => opt.setName('rol4').setDescription('4. rol'))
    .addStringOption(opt => opt.setName('emoji4').setDescription('4. emoji'))
    .addRoleOption(opt => opt.setName('rol5').setDescription('5. rol'))
    .addStringOption(opt => opt.setName('emoji5').setDescription('5. emoji'))
    .addStringOption(opt => opt.setName('aciklama').setDescription('Mesaj aciklamasi'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ content: 'Bu komutu kullanmak icin **Rolleri Yonet** yetkisine sahip olmalisin!', ephemeral: true });
    }

    const kanal = interaction.options.getChannel('kanal');
    const baslik = interaction.options.getString('baslik');
    const aciklama = interaction.options.getString('aciklama') || 'Asagidaki emojilere tiklayarak rolunu sec!';

    const eslesmeler = [];
    for (let i = 1; i <= 5; i++) {
      const rol = interaction.options.getRole('rol' + i);
      const emoji = interaction.options.getString('emoji' + i);
      if (rol && emoji) {
        eslesmeler.push({ emoji: emoji.trim(), rolId: rol.id, rolIsim: rol.name });
      }
    }

    if (eslesmeler.length === 0) {
      return interaction.reply({ content: 'En az bir emoji-rol eslesmesi gerekli!', ephemeral: true });
    }

    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(__dirname, '..', 'reaction-roles.json');

    let db = {};
    try { if (fs.existsSync(dbPath)) db = JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch (e) {}

    const embedDesc = eslesmeler.map(e => `${e.emoji} → **${e.rolIsim}**`).join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x00BFFF)
      .setTitle(`:label: ${baslik}`)
      .setDescription(`${aciklama}\n\n${embedDesc}\n\n:information_source: Emojiye tikla = rol al/kaldir`)
      .setFooter({ text: 'Reaction Role Sistemi' })
      .setTimestamp();

    const msg = await kanal.send({ embeds: [embed] });

    for (const e of eslesmeler) {
      try { await msg.react(e.emoji); } catch (err) {}
    }

    if (!db[interaction.guild.id]) db[interaction.guild.id] = {};
    db[interaction.guild.id][msg.id] = {};
    for (const e of eslesmeler) {
      db[interaction.guild.id][msg.id][e.emoji] = e.rolId;
    }

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    await interaction.reply({
      content: `:white_check_mark: Reaction role mesaji ${kanal} kanalina gonderildi! ${eslesmeler.length} emoji-rol eslesmesi aktif.`,
      ephemeral: true,
    });
  },
};
