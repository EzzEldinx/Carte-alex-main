import express from 'express';
import db from './db.js';
import { addWhereVestiges, addWhereDecouvertes, addWhereBiblio, addOrderAliasOnSelectDistinct, cacheMiddleware } from './middleware.js';

const router = express.Router();

// ... (other routes remain the same) ...
router.get('/', (req, res) => res.render('index.html'));
router.get('/carte', (req, res) => res.render('map.html'));

router.get('/getValues/:tableName', cacheMiddleware, addOrderAliasOnSelectDistinct, async (req, res, next) => {
    const { tableName } = req.params;
    let dbquery = res.locals.selectQuery;
    switch (tableName) {
        case 'vestiges': dbquery += ' FROM vestiges JOIN datations ON vestiges.id = datations.id_vestige JOIN caracterisations ON vestiges.id_caracterisation = caracterisations.id JOIN periodes ON datations.id_periode = periodes.id'; break;
        case 'bibliographies': dbquery += ' FROM bibliographies JOIN personnes ON bibliographies.id_auteur1 = personnes.id'; break;
        case 'periodes': dbquery += ' FROM periodes'; break;
        case 'decouvertes': dbquery += ' FROM decouvertes JOIN personnes ON decouvertes.id_inventeur = personnes.id'; break;
        default: return res.status(404).json({ error: 'Table not found' });
    }
    dbquery += res.locals.orderQuery;
    try {
        const values = await db.any(dbquery);
        res.json(values);
    } catch (error) {
        next(error);
    }
});

router.get('/sitesFouilles/vestiges', addWhereVestiges, async (req, res, next) => {
    const dbquery = `
        SELECT DISTINCT sf.fid as id FROM sites_fouilles AS sf
        JOIN vestiges AS v ON v.id_site = sf.id
        JOIN datations AS dat ON dat.id_vestige = v.id
        JOIN periodes AS p ON dat.id_periode = p.id
        JOIN caracterisations AS c ON v.id_caracterisation = c.id
        ${res.locals.whereClause}`;
    try {
        const values = await db.any(dbquery);
        res.json(values);
    } catch (error) {
        next(error);
    }
});

router.get('/sitesFouilles/decouvertes', addWhereDecouvertes, async (req, res, next) => {
    const dbquery = `
        SELECT DISTINCT sf.fid as id FROM sites_fouilles AS sf
        JOIN decouvertes AS d ON sf.id = d.id_site
        JOIN personnes AS p ON d.id_inventeur = p.id
        ${res.locals.whereClause}`;
    try {
        const values = await db.any(dbquery);
        res.json(values);
    } catch (error) {
        next(error);
    }
});

router.get('/sitesFouilles/bibliographies', addWhereBiblio, async (req, res, next) => {
    const dbquery = `
        SELECT DISTINCT sf.fid as id FROM sites_fouilles AS sf
        JOIN decouvertes AS d ON sf.id = d.id_site
        JOIN "references_biblio" AS rb ON d.id = rb.id_decouverte
        JOIN bibliographies AS b ON b.id = rb.id_biblio
        JOIN personnes AS p ON p.id = b.id_auteur1
        ${res.locals.whereClause}`;
    try {
        const values = await db.any(dbquery);
        res.json(values);
    } catch (error) {
        next(error);
    }
});

// ** START: NEW ROUTE FOR POPUP DETAILS **
router.get('/sitesFouilles/:fid/details', async (req, res, next) => {
    const { fid } = req.params;
    try {
        // Query 1: Get the main site details
        const site = await db.oneOrNone('SELECT id, num_tkaczow, commentaire FROM sites_fouilles WHERE fid = $1', [fid]);
        if (!site) {
            return res.status(404).json({ error: 'Site not found' });
        }

        // Query 2: Get associated vestiges
        const vestiges = await db.any(`
            SELECT c.caracterisation, p.periode FROM vestiges v
            JOIN caracterisations c ON v.id_caracterisation = c.id
            LEFT JOIN datations d ON v.id = d.id_vestige
            LEFT JOIN periodes p ON d.id_periode = p.id
            WHERE v.id_site = $1
        `, [site.id]);

        // Query 3: Get associated discoveries and bibliographies
        const bibliographies = await db.any(`
            SELECT DISTINCT b.nom_document FROM bibliographies b
            JOIN "references_biblio" rb ON b.id = rb.id_biblio
            JOIN decouvertes d ON rb.id_decouverte = d.id
            WHERE d.id_site = $1
        `, [site.id]);
        
        // Combine and send the response
        res.json({
            details: site,
            vestiges: vestiges,
            bibliographies: bibliographies
        });

    } catch (error) {
        next(error);
    }
});
// ** END: NEW ROUTE FOR POPUP DETAILS **


export default router;