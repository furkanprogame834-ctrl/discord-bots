const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.BOT_TOKEN || 'MTUzOTM2MTE2NzgyMTI1MDY1MQ.GQlFa1.qFtT1GKE8ESU-RMBmxQnuycPCF5cDA6PobmIqo';
const CLIENT_ID = '1539361167821250651';

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log(`${commands.length} komut kaydediliyor...`);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log(`${commands.length} komut basariyla kaydedildi!`);
  } catch (error) {
    console.error('Hata:', error);
  }
})();
