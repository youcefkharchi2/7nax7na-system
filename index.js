// Discord Bot Only - Hosted on Bot-Hosting.net / KataBump
// This bot connects to the Render API for database operations

const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const http = require('http');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Render API URL
const RENDER_API = process.env.RENDER_API_URL || 'https://sevennax7naa-system.onrender.com';
const ADMIN_CHANNEL_ID = process.env.ADMIN_CHANNEL_ID || '1416548424613892296';

client.once('ready', () => {
    console.log(`🤖 Bot logged in as ${client.user.tag}`);
    console.log('📊 Bot is in', client.guilds.cache.size, 'servers');
});

// Simple HTTP server to receive requests from Render
const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.method === 'POST' && req.url === '/send-whitelist') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { rp_name, rp_age, real_name, real_age, country, steam_link, story, user_id, user_avatar, app_id } = data;
                
                // Create embed with all new fields
                const embed = new EmbedBuilder()
                    .setColor('#27F5A3')
                    .setTitle('<a:12288110951715309341:1267875257977540720> طلب وايت ليست جديد')
                    .setDescription(`**This is a presentation by** <@${user_id}>\n\n<a:1406253515390582864:1490483086629273682> **RP Name:**\n${rp_name}\n\n<a:1406253515390582864:1490483086629273682> **RP Age:**\n${rp_age}\n\n<a:1406253515390582864:1490483086629273682> **Real Name:**\n${real_name}\n\n<a:1406253515390582864:1490483086629273682> **Real Age:**\n${real_age}\n\n<a:1406253515390582864:1490483086629273682> **COUNTRY:**\n${country}\n\n<a:1406253515390582864:1490483086629273682> **Steam Link:**\n${steam_link}\n\n<a:1406253515390582864:1490483086629273682> **Your Story:**\n${story}`)
                    .setImage('https://cdn.discordapp.com/attachments/1416548424613892296/1490497355915726878/h.jpg')
                    .setFooter({ text: 'ᵖᵒʷᵉʳᵉᵈ ᵇʸ 7nax7na' }) // بدون صورة
                    .setTimestamp();
                
                // Create buttons
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`approve_${app_id}_${user_id || 'website'}`)
                            .setLabel('قبول')
                            .setEmoji('836990231445897246')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`reject_${app_id}_${user_id || 'website'}`)
                            .setLabel('رفض')
                            .setEmoji('802864230226198528')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`block_${app_id}_${user_id || 'website'}`)
                            .setLabel('حظر')
                            .setEmoji('1340348621119295499')
                            .setStyle(ButtonStyle.Secondary)
                    );
                
                // Send to Discord with user mention
                const channel = await client.channels.fetch(ADMIN_CHANNEL_ID);
                await channel.send({
                    content: `📩 تقديم جديد على الوايت ليست!\n<@${user_id}>`, // منشن الديسكورد
                    embeds: [embed],
                    components: [row]
                });
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
                console.log('✅ Message with buttons sent to Discord');
                
            } catch (err) {
                console.error('Error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// Start HTTP server
const HTTP_PORT = process.env.HTTP_PORT || 3000;
server.listen(HTTP_PORT, () => {
    console.log(`🌐 HTTP server listening on port ${HTTP_PORT}`);
});

// Poll Render API for new whitelist requests (since KataBump has no public URL)
async function pollForNewRequests() {
    try {
        const response = await fetch(`${RENDER_API}/api/whitelist/pending`);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const requests = await response.json();
        
        for (const req of requests) {
            // Send to Discord with buttons
            const embed = new EmbedBuilder()
                .setColor('#27F5A3')
                .setTitle('<a:1267875257977540720:1490483150416122007> طلب وايت ليست جديد')
                .setDescription(`**This is a presentation by** <@${req.user_id}>\n\n<a:1406253515390582864:1490483086629273682> **RP Name:**\n${req.rp_name}\n\n<a:1406253515390582864:1490483086629273682> **RP Age:**\n${req.rp_age}\n\n<a:1406253515390582864:1490483086629273682> **Real Name:**\n${req.real_name}\n\n<a:1406253515390582864:1490483086629273682> **Real Age:**\n${req.real_age}\n\n<a:1406253515390582864:1490483086629273682> **COUNTRY:**\n${req.country}\n\n<a:1406253515390582864:1490483086629273682> **Steam Link:**\n${req.steam_link}\n\n<a:1406253515390582864:1490483086629273682> **Your Story:**\n${req.story}`)
                .setImage('https://cdn.discordapp.com/attachments/1420756765154349126/1490486258626199701/h.jpg')
                .setFooter({ text: 'ᵖᵒʷᵉʳᵉᵈ ᵇʸ 7nax7na' }) // بدون صورة
                .setTimestamp();
            
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`approve_${req.id}_${req.user_id || 'website'}`)
                        .setLabel('قبول')
                        .setEmoji('836990231445897246')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`reject_${req.id}_${req.user_id || 'website'}`)
                        .setLabel('رفض')
                        .setEmoji('802864230226198528')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`block_${req.id}_${req.user_id || 'website'}`)
                        .setLabel('حظر')
                        .setEmoji('1340348621119295499')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            const channel = await client.channels.fetch(ADMIN_CHANNEL_ID);
            await channel.send({
                content: `📩 تقديم جديد على الوايت ليست!\n<@${req.user_id}>`, // منشن الديسكورد
                embeds: [embed],
                components: [row]
            });
            
            // Mark as notified
            await fetch(`${RENDER_API}/api/whitelist/${req.id}/notified`, { method: 'POST' });
            console.log(`✅ Request ${req.id} sent to Discord with buttons`);
        }
    } catch (err) {
        console.error('Polling error:', err.message);
    }
}

// Poll every 10 seconds
setInterval(pollForNewRequests, 10000);
console.log('⏱️ Started polling for new whitelist requests every 10 seconds');

// Handle button interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    
    const customId = interaction.customId;
    const [action, appId, userId] = customId.split('_');
    
    if (!['approve', 'reject', 'block'].includes(action)) return;
    
    // Check if user is admin
    const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [];
    if (!adminIds.includes(interaction.user.id)) {
        return interaction.reply({ content: '❌ ليس لديك صلاحية!', ephemeral: true });
    }
    
    if (action === 'block') {
        // Show modal for block reason
        const modal = new ModalBuilder()
            .setCustomId(`block_modal_${appId}_${userId}`)
            .setTitle('<a:1340348621119295499:1490503532485546275> سبب الحظر');
        
        const reasonInput = new TextInputBuilder()
            .setCustomId('block_reason')
            .setLabel('سبب الحظر')
            .setPlaceholder('اكتب سبب الحظر هنا...')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);
        
        const actionRow = new ActionRowBuilder().addComponents(reasonInput);
        modal.addComponents(actionRow);
        
        return interaction.showModal(modal);
    }
    
    // Call Render API to update status
    try {
        const endpoint = action === 'approve' ? 'approve' : 'reject';
        const response = await fetch(`${RENDER_API}/api/whitelist/${appId}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error('API Error');
        
        const actionText = action === 'approve' ? '<a:836990231445897246:1490503568464019456> تم القبول' : '<a:802864230226198528:1490503551867424920> تم الرفض';
        const color = action === 'approve' ? '#27F5A3' : '#ff6b6b';
        
        // Get original embed and just disable buttons (keep original message content)
        const originalEmbed = interaction.message.embeds[0];
        
        // Disable all buttons (show they're no longer active)
        const disabledRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`approve_${appId}_disabled`)
                    .setLabel('قبول')
                    .setEmoji('836990231445897246')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId(`reject_${appId}_disabled`)
                    .setLabel('رفض')
                    .setEmoji('802864230226198528')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId(`block_${appId}_disabled`)
                    .setLabel('حظر')
                    .setEmoji('1340348621119295499')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );
        
        await interaction.update({ 
            embeds: [originalEmbed],
            components: [disabledRow]
        });
        
    } catch (err) {
        console.error('Error:', err);
        await interaction.reply({ content: '❌ حدث خطأ في الاتصال بالسيرفر!', ephemeral: true });
    }
});

// Handle modal submission for block
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    
    if (interaction.customId.startsWith('block_modal_')) {
        const [, , appId, userId] = interaction.customId.split('_');
        const reason = interaction.fields.getTextInputValue('block_reason');
        
        try {
            // Call Render API to block
            const response = await fetch(`${RENDER_API}/api/whitelist/${appId}/block`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });
            
            if (!response.ok) throw new Error('API Error');
            
            // Get original embed and just disable buttons (keep original message content)
            const originalEmbed = interaction.message.embeds[0];
            
            // Disable all buttons
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`approve_${appId}_disabled`)
                        .setLabel('قبول')
                        .setEmoji('836990231445897246')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId(`reject_${appId}_disabled`)
                        .setLabel('رفض')
                        .setEmoji('802864230226198528')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId(`block_${appId}_disabled`)
                        .setLabel('حظر')
                        .setEmoji('1340348621119295499')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );
            
            await interaction.update({ 
                embeds: [originalEmbed],
                components: [disabledRow]
            });
            
        } catch (err) {
            console.error('Error:', err);
            await interaction.reply({ content: '❌ حدث خطأ!', ephemeral: true });
        }
    }
});

// Handle delete button
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    
    const customId = interaction.customId;
    
    if (!customId.startsWith('delete_')) return;
    
    const [, appId] = customId.split('_');
    
    // Check if user is admin
    const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [];
    if (!adminIds.includes(interaction.user.id)) {
        return interaction.reply({ content: '❌ ليس لديك صلاحية!', ephemeral: true });
    }
    
    try {
        // Acknowledge first, then delete
        await interaction.deferUpdate();
        await interaction.message.delete();
        console.log(`🗑️ Message ${appId} deleted by ${interaction.user.username}`);
    } catch (err) {
        console.error('Error deleting message:', err);
        await interaction.followUp({ content: '❌ حدث خطأ أثناء الحذف!', ephemeral: true });
    }
});

// Login
client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log('✅ Bot started successfully'))
    .catch(err => console.error('❌ Login failed:', err));
