const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-ac')
    .setDescription('Yeni ticket acar'),
  async execute(interaction) {
    await createTicket(interaction.member, interaction.guild, interaction.channel, interaction);
  },
};

async function createTicket(member, guild, textChannel, interaction) {
  const fs = require('fs');
  const path = require('path');
  const configPath = path.join(__dirname, '..', 'guild-config.json');
  const ticketDbPath = path.join(__dirname, '..', 'ticket-db.json');

  const replyHata = async (mesaj) => {
    if (!interaction) return;
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({ content: mesaj }).catch(() => {});
    } else if (!interaction.replied) {
      await interaction.reply({ content: mesaj, flags: 64 }).catch(() => {});
    }
  };

  let config = {};
  try {
    if (fs.existsSync(configPath)) config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {}

  let ticketDb = {};
  try {
    if (fs.existsSync(ticketDbPath)) ticketDb = JSON.parse(fs.readFileSync(ticketDbPath, 'utf8'));
  } catch (e) {}

  const guildConfig = config[guild.id] || {};
  const destekRolId = guildConfig.ticketRole;

  if (ticketDb[guild.id]?.[member.id]) {
    const msg = 'Zaten acik bir ticketin var! Once onu kapat.';
    await replyHata(msg);
    return;
  }

  // Discord kanal isimleri icin guvenli ad: kucuk harf, turkce karakterler ingilizceye, ozel karakterler tire
  const turkce = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'I': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u' };
  let kanalAd = `ticket-${member.user.username}`.toLowerCase()
    .split('').map(c => turkce[c] || c).join('')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);

  const ticketKanal = await guild.channels.create({
    name: kanalAd,
    type: 0,
    permissionOverwrites: [
      { id: guild.id, deny: ['ViewChannel'] },
      { id: member.id, allow: ['ViewChannel', PermissionFlagsBits.SendMessages, 'AttachFiles'] },
      ...(guild.members.me ? [{ id: guild.members.me.id, allow: ['ViewChannel', PermissionFlagsBits.SendMessages, 'ManageChannels'] }] : []),
      ...(destekRolId ? [{ id: destekRolId, allow: ['ViewChannel', PermissionFlagsBits.SendMessages] }] : []),
    ],
  });

  if (!ticketDb[guild.id]) ticketDb[guild.id] = {};
  ticketDb[guild.id][member.id] = { channel: ticketKanal.id, created: Date.now() };

  fs.writeFileSync(ticketDbPath, JSON.stringify(ticketDb, null, 2));

  const embed = new EmbedBuilder()
    .setColor(0xFFA500)
    .setTitle(':ticket: Ticket Acildi!')
    .setDescription(`Merhaba ${member}, destek ekibimiz yakindan donecek!\n\nLutfen sorununuzu acikca anlatin.`)
    .addFields(
      { name: ':bust_in_silhouette: Kullanici', value: `${member}`, inline: true },
      { name: ':clock1: Acilis', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
    )
    .setTimestamp();

    const kapatBtn = new ButtonBuilder()
      .setCustomId('ticket-kapat')
      .setLabel('Ticketi Kapat')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger);

    const sahiplenBtn = new ButtonBuilder()
      .setCustomId('ticket-sahiplen')
      .setLabel('Ticketi Sahiplen')
      .setEmoji('✋')
      .setStyle(ButtonStyle.Primary);

  const satir = new ActionRowBuilder().addComponents(sahiplenBtn, kapatBtn);

  await ticketKanal.send({ content: `${member}` + (destekRolId ? ` <@&${destekRolId}>` : ''), embeds: [embed], components: [satir] });

  if (interaction) {
    if (interaction.isChatInputCommand() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: `:white_check_mark: Ticket acildi: ${ticketKanal}`, flags: 64 });
    } else if (interaction.isButton()) {
      await interaction.editReply({ content: `:white_check_mark: Ticket acildi: ${ticketKanal}`, embeds: [], components: [] }).catch(() => {});
    } else if (textChannel) {
      await textChannel.send({ content: `:white_check_mark: ${member} icin ticket acildi: ${ticketKanal}` });
    }
  }
}

module.exports.createTicket = createTicket;
