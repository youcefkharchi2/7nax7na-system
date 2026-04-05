const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

// Database setup
const db = new sqlite3.Database('./database.sqlite');

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS whitelist_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        username TEXT,
        rp_concept TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        username TEXT,
        item_name TEXT,
        price TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Discord Bot Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Slash Commands
const commands = [
    new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('تقديم على whitelist')
        .addStringOption(option =>
            option.setName('rp_concept')
                .setDescription('مفهومك للرول بلاي')
                .setRequired(true)),
    
    new SlashCommandBuilder()
        .setName('buy')
        .setDescription('شراء منتج من المتجر')
        .addStringOption(option =>
            option.setName('item')
                .setDescription('اسم المنتج')
                .setRequired(true)
                .addChoices(
                    { name: 'BMW M3 - $20', value: 'BMW M3' },
                    { name: 'Kawasaki Z - $15', value: 'Kawasaki Z' }
                ))
        .addStringOption(option =>
            option.setName('payment')
                .setDescription('طريقة الدفع')
                .setRequired(true)
                .addChoices(
                    { name: 'PayPal', value: 'paypal' },
                    { name: 'RedotPay', value: 'redotpay' },
                    { name: 'Bridi Mob', value: 'bridimob' },
                    { name: 'CCP', value: 'ccp' }
                )),
    
    new SlashCommandBuilder()
        .setName('add')
        .setDescription('إضافة منتج جديد (للأدمن فقط)')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('اسم المنتج')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('price')
                .setDescription('السعر')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('وصف المنتج')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('image')
                .setDescription('رابط الصورة')
                .setRequired(false)),
    
    new SlashCommandBuilder()
        .setName('check')
        .setDescription('التحقق من حالة الطلب')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('نوع الطلب')
                .setRequired(true)
                .addChoices(
                    { name: 'Whitelist', value: 'whitelist' },
                    { name: 'Purchase', value: 'purchase' }
                ))
];

// Register commands
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands.map(cmd => cmd.toJSON()) }
        );
        console.log('Commands registered successfully!');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
})();

// Bot ready event
client.once('ready', () => {
    console.log(`Bot is online! Logged in as ${client.user.tag}`);
    
    // Set bot presence
    client.user.setActivity('7NAX7NA Server', { type: 3 }); // WATCHING
});

// Handle slash commands
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    const { commandName, user, options } = interaction;
    
    if (commandName === 'whitelist') {
        const rpConcept = options.getString('rp_concept');
        
        // Save to database
        db.run(
            'INSERT INTO whitelist_applications (user_id, username, rp_concept) VALUES (?, ?, ?)',
            [user.id, user.username, rpConcept],
            function(err) {
                if (err) {
                    console.error(err);
                    return interaction.reply({ content: '❌ حدث خطأ! حاول مرة أخرى.', ephemeral: true });
                }
                
                const embed = new EmbedBuilder()
                    .setColor('#27F5A3')
                    .setTitle('✅ تم استلام طلب الوايت ليست')
                    .setDescription(`**المستخدم:** ${user.username}\n**الإيدي:** ${user.id}\n\n**مفهوم الرول بلاي:**\n${rpConcept}`)
                    .setTimestamp();
                
                // Send to admin channel
                const adminChannel = client.channels.cache.get(process.env.ADMIN_CHANNEL_ID);
                if (adminChannel) {
                    adminChannel.send({ embeds: [embed] });
                }
                
                interaction.reply({ 
                    content: '✅ تم تقديم طلبك بنجاح! سيتم مراجعته قريباً.',
                    ephemeral: true 
                });
            }
        );
    }
    
    else if (commandName === 'buy') {
        const item = options.getString('item');
        const payment = options.getString('payment');
        const price = item === 'BMW M3' ? '$20.00' : '$15.00';
        
        // Save to database
        db.run(
            'INSERT INTO purchases (user_id, username, item_name, price) VALUES (?, ?, ?, ?)',
            [user.id, user.username, item, price],
            function(err) {
                if (err) {
                    console.error(err);
                    return interaction.reply({ content: '❌ حدث خطأ! حاول مرة أخرى.', ephemeral: true });
                }
                
                const embed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle('🛒 طلب شراء جديد')
                    .setDescription(`**المشتري:** ${user.username}\n**المنتج:** ${item}\n**السعر:** ${price}\n**طريقة الدفع:** ${payment}`)
                    .setTimestamp();
                
                // Send to admin channel
                const adminChannel = client.channels.cache.get(process.env.PURCHASES_CHANNEL_ID);
                if (adminChannel) {
                    adminChannel.send({ 
                        embeds: [embed],
                        content: `<@${user.id}> قام بطلب شراء ${item}`
                    });
                }
                
                interaction.reply({ 
                    content: `🛒 تم إرسال طلبك لشراء **${item}**!\nانتظر تأكيد الدفع عبر **${payment}**.`,
                    ephemeral: true 
                });
            }
        );
    }
    
    else if (commandName === 'add') {
        // Check if user is admin
        if (!process.env.ADMIN_IDS.split(',').includes(user.id)) {
            return interaction.reply({ content: '❌ ليس لديك صلاحية!', ephemeral: true });
        }
        
        const name = options.getString('name');
        const price = options.getString('price');
        const description = options.getString('description');
        const image = options.getString('image') || 'https://via.placeholder.com/300';
        
        // Here you would typically add to a products table or update a config file
        // For now, just confirm
        interaction.reply({ 
            content: `✅ تم إضافة المنتج:\n**الاسم:** ${name}\n**السعر:** ${price}\n**الوصف:** ${description}`,
            ephemeral: true 
        });
    }
    
    else if (commandName === 'check') {
        const type = options.getString('type');
        
        if (type === 'whitelist') {
            db.all(
                'SELECT * FROM whitelist_applications WHERE user_id = ? ORDER BY created_at DESC',
                [user.id],
                (err, rows) => {
                    if (err || rows.length === 0) {
                        return interaction.reply({ content: '❌ لا توجد طلبات وايت ليست.', ephemeral: true });
                    }
                    
                    const latest = rows[0];
                    const embed = new EmbedBuilder()
                        .setColor(latest.status === 'approved' ? '#27F5A3' : latest.status === 'rejected' ? '#ff6b6b' : '#ffd93d')
                        .setTitle('📝 حالة طلب الوايت ليست')
                        .addFields(
                            { name: 'الحالة', value: latest.status === 'pending' ? '⏳ قيد المراجعة' : latest.status === 'approved' ? '✅ مقبول' : '❌ مرفوض', inline: true },
                            { name: 'تاريخ التقديم', value: latest.created_at, inline: true }
                        )
                        .setTimestamp();
                    
                    interaction.reply({ embeds: [embed], ephemeral: true });
                }
            );
        } else {
            db.all(
                'SELECT * FROM purchases WHERE user_id = ? ORDER BY created_at DESC',
                [user.id],
                (err, rows) => {
                    if (err || rows.length === 0) {
                        return interaction.reply({ content: '❌ لا توجد مشتريات.', ephemeral: true });
                    }
                    
                    const latest = rows[0];
                    const embed = new EmbedBuilder()
                        .setColor(latest.status === 'completed' ? '#27F5A3' : '#ffd93d')
                        .setTitle('🛒 حالة الشراء')
                        .addFields(
                            { name: 'المنتج', value: latest.item_name, inline: true },
                            { name: 'الحالة', value: latest.status === 'pending' ? '⏳ قيد المعالجة' : '✅ مكتمل', inline: true }
                        )
                        .setTimestamp();
                    
                    interaction.reply({ embeds: [embed], ephemeral: true });
                }
            );
        }
    }
});

// Express API Server
const app = express();
app.use(cors());
app.use(express.json());

// Clean URLs without .html extension (must be BEFORE static)
app.get('/interface', (req, res) => res.sendFile('index.html', { root: '.' }));
app.get('/store', (req, res) => res.sendFile('store.html', { root: '.' }));
app.get('/whitelist', (req, res) => res.sendFile('whitelist.html', { root: '.' }));
app.get('/login', (req, res) => res.sendFile('login.html', { root: '.' }));
app.get('/auth', (req, res) => res.sendFile('auth.html', { root: '.' }));

// Serve static files (HTML, CSS, JS) - AFTER routes
app.use(express.static('.'));

// API Routes
app.get('/api/stats', (req, res) => {
    db.get('SELECT COUNT(*) as pending_whitelist FROM whitelist_applications WHERE status = "pending"', (err, whitelistRow) => {
        db.get('SELECT COUNT(*) as pending_purchases FROM purchases WHERE status = "pending"', (err2, purchaseRow) => {
            res.json({
                pendingWhitelist: whitelistRow?.pending_whitelist || 0,
                pendingPurchases: purchaseRow?.pending_purchases || 0,
                botStatus: client.user ? 'online' : 'offline'
            });
        });
    });
});

app.get('/api/whitelist', (req, res) => {
    db.all('SELECT * FROM whitelist_applications ORDER BY created_at DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/purchases', (req, res) => {
    db.all('SELECT * FROM purchases ORDER BY created_at DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Update status endpoints
app.post('/api/whitelist/:id/approve', (req, res) => {
    db.run('UPDATE whitelist_applications SET status = "approved" WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Approved' });
    });
});

app.post('/api/whitelist/:id/reject', (req, res) => {
    db.run('UPDATE whitelist_applications SET status = "rejected" WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Rejected' });
    });
});

// Submit whitelist application from website
app.post('/api/whitelist/submit', (req, res) => {
    const { discord_name, rp_concept, user_id, user_avatar } = req.body;
    
    // Save to database
    db.run(
        'INSERT INTO whitelist_applications (user_id, username, rp_concept) VALUES (?, ?, ?)',
        [user_id || 'website', discord_name, rp_concept],
        function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            // Create embed for Discord
            const embed = new EmbedBuilder()
                .setColor('#27F5A3')
                .setTitle('📝 طلب وايت ليست جديد من الموقع')
                .setDescription(`**اسم الديسكورد:** ${discord_name}\n\n**مفهوم الرول بلاي:**\n${rp_concept}`)
                .setThumbnail(user_avatar || 'https://cdn.discordapp.com/embed/avatars/0.png')
                .setTimestamp()
                .setFooter({ text: `ID: ${this.lastID}` });
            
            // Send to admin channel
            const adminChannel = client.channels.cache.get(process.env.ADMIN_CHANNEL_ID);
            if (adminChannel) {
                adminChannel.send({ 
                    embeds: [embed],
                    content: '📩 تقديم جديد على الوايت ليست!'
                });
            }
            
            res.json({ 
                success: true, 
                message: 'تم إرسال طلبك بنجاح!',
                id: this.lastID 
            });
        }
    );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});

// Login bot with timeout
async function startBot() {
    console.log('Starting bot login process...');
    console.log('Token length:', process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.length : 0);
    
    try {
        const loginPromise = client.login(process.env.DISCORD_TOKEN);
        
        // Timeout after 10 seconds
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Login timeout - took more than 10 seconds')), 10000);
        });
        
        await Promise.race([loginPromise, timeoutPromise]);
        
        console.log('✅ Bot logged in successfully!');
        console.log(`🤖 Bot is ONLINE as ${client.user.tag}`);
        console.log('📊 Bot is in', client.guilds.cache.size, 'servers');
    } catch (err) {
        console.error('❌ Bot failed to login:', err.message);
        console.error('Error code:', err.code);
        console.error('Full error:', err);
    }
}

startBot();

// Bot ready event (backup)
client.once('ready', () => {
    console.log(`🤖 Bot is ONLINE as ${client.user.tag}`);
    console.log('📊 Bot is in', client.guilds.cache.size, 'servers');
});

client.on('debug', info => {
    if (info.includes('login') || info.includes('token')) {
        console.log('Debug:', info);
    }
});

client.on('error', error => {
    console.error('Client Error:', error);
});

// Handle errors
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});
