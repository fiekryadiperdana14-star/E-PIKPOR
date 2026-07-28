const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function populate() {
    try {
        console.log('Clearing existing data (except admin)...');
        // Clear org_leaders
        await db.query('DELETE FROM org_leaders');
        
        // Disable existing users to avoid foreign key constraints instead of deleting
        await db.query(`UPDATE users SET is_active = FALSE WHERE role != 'admin'`);

        console.log('Inserting Top Leaders...');
        await db.query(`
            INSERT INTO org_leaders (jabatan, nama_lengkap, pangkat, urutan) VALUES 
            ('KASAT LANTAS', 'AH. HUDI ARIF, S.A.P., S.I.K., M.A.', 'AJUN KOMISARIS BESAR POLISI', 1),
            ('WAKASAT LANTAS', 'RINI WIDIYANTI, S.H., M.H.', 'KOMISARIS POLISI', 2),
            ('KAUR BIN OPS', 'DEDEN JUANDI, S.H., M.M.', 'AJUN KOMISARIS POLISI', 3)
        `);

        console.log('Preparing User Inserts...');
        const passwordHash = await bcrypt.hash('password123', 10);
        
        let userCounter = 1;
        const makeUser = (nama, pangkat, role, subnit_id, regu_id) => {
            const username = nama.split(' ')[0].toLowerCase() + userCounter++;
            return [nama, username, passwordHash, role, pangkat, subnit_id, regu_id];
        };

        const usersToInsert = [
            // BAMIN GAKKUM
            makeUser('AGRET DEVIA PRATIWI PUTRI', 'BRIPTU', 'bamin', null, null),
            makeUser('MUTIARA MAULINA DEWI', 'BRIPDA', 'bamin', null, null),
            
            // KANIT GAKKUM
            makeUser('FIEKRY ADI PERDANA, S.I.Kom.', 'AJUN KOMISARIS POLISI', 'kanit', null, null),

            // KASUBNIT
            makeUser('SUCIPTO ARI WARDANI, S.A.P., M.A.P.', 'INSPEKTUR POLISI DUA', 'kasubnit', null, null),
            makeUser('SARI WULANDARI A., S.H., CPHR.', 'INSPEKTUR POLISI DUA', 'kasubnit', null, null),

            // SUBNIT TIMUR (subnit_id 1)
            makeUser('WATCHID KHOMARUDIN', 'AIPDA', 'danregu', 1, 1),
            makeUser('DANI', 'AIPDA', 'anggota', 1, 1),
            makeUser('GANEPA CAHYA FIRDAUS, S.H', 'BRIPKA', 'danregu', 1, 2),
            makeUser('BAMBANG', 'AIPDA', 'anggota', 1, 2),
            makeUser('IBNU NAROWI, S.H.', 'AIPTU', 'danregu', 1, 3),

            // SUBNIT TENGAH (subnit_id 2)
            makeUser('SIEGIT DWI HARYANTO, S.H.', 'AIPDA', 'danregu', 2, 4),
            makeUser('FRANCISKUS GOKTUA S', 'BRIPKA', 'anggota', 2, 4),
            makeUser('ADI', 'AIPTU', 'danregu', 2, 5),
            makeUser('YANUAR', 'BRIPDA', 'anggota', 2, 5),
            makeUser('RUHINDA', 'AIPTU', 'danregu', 2, 6),
            makeUser('RAJA PUTRA PERDANA', 'BRIPDA', 'anggota', 2, 6),

            // SUBNIT BARAT (subnit_id 3)
            makeUser('TOHA', 'AIPTU', 'danregu', 3, 7),
            makeUser('ALVIN', 'BRIPTU', 'anggota', 3, 7),
            makeUser('NANDI', 'AIPTU', 'danregu', 3, 8),
            makeUser('ADAM', 'BRIPTU', 'anggota', 3, 8),
            makeUser('INDRA', 'AIPDA', 'danregu', 3, 9),
            makeUser('ARIZAL', 'BRIPDA', 'anggota', 3, 9),
        ];

        console.log('Inserting Users...');
        for (const u of usersToInsert) {
            await db.query(`
                INSERT INTO users (nama_lengkap, username, password, role, pangkat, subnit_id, regu_id, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
            `, u);
        }

        console.log('Success! Data populated.');
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
populate();
