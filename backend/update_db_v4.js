const db = require('./config/db');

async function updateDatabase() {
    console.log('Starting Database Update V4...');
    try {
        // 1. Add file_url to sop_documents if it doesn't exist
        console.log('Adding file_url to sop_documents...');
        await db.query(`
            ALTER TABLE sop_documents 
            ADD COLUMN IF NOT EXISTS file_url VARCHAR(255)
        `);
        console.log('Column file_url added successfully.');

        // 2. Create org_leaders table
        console.log('Creating org_leaders table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS org_leaders (
                id SERIAL PRIMARY KEY,
                jabatan VARCHAR(100) NOT NULL,
                nama_lengkap VARCHAR(100) NOT NULL,
                pangkat VARCHAR(50) NOT NULL,
                urutan INT DEFAULT 0
            )
        `);
        console.log('Table org_leaders created successfully.');

        // 3. Insert default data into org_leaders if empty
        const [leaders] = await db.query('SELECT COUNT(*) as count FROM org_leaders');
        if (leaders[0].count === '0' || leaders[0].count === 0) {
            console.log('Inserting default org_leaders...');
            await db.query(`
                INSERT INTO org_leaders (jabatan, nama_lengkap, pangkat, urutan) VALUES 
                ('KASAT LANTAS', 'AH. HUDI ARIF, S.A.P., S.I.K., M.A.', 'AKBP', 1),
                ('WAKASAT LANTAS', 'RINI WIDIYANTI, S.H., M.H.', 'Kompol', 2),
                ('KAUR BIN OPS', 'DEDEN JUANDI, S.H., M.M.', 'AKP', 3)
            `);
            console.log('Default org_leaders inserted successfully.');
        } else {
            console.log('org_leaders already has data, skipping insert.');
        }

        console.log('Database Update V4 Completed Successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error updating database:', error);
        process.exit(1);
    }
}

updateDatabase();
